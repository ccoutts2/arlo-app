import { error, fail, redirect } from '@sveltejs/kit';
import prisma from './prisma';
import { deleteFiles, photoProblem, savePhoto } from './files';
import { parseLogForm, type LogFormValues } from '$lib/schemas/log';
import { levels, type SkillLevelKey } from '$lib/log';
import { localParts, zonedToUtc } from '$lib/time';

export const entryInclude = {
	pet: { select: { id: true, name: true, photoId: true } },
	author: { select: { id: true, givenName: true } },
	skills: { include: { skill: { select: { id: true, name: true } } } },
	files: { select: { id: true }, orderBy: { createdAt: 'asc' as const } },
	levelChanges: { include: { skill: { select: { name: true } } } }
};

/** A log entry in the user's household, or 404. */
export async function entryOr404(householdId: string, id: string) {
	const e = await prisma.logEntry.findFirst({
		where: { id, pet: { householdId } },
		include: entryInclude
	});
	if (!e) error(404, 'Not found');
	return e;
}

export function emptyLogValues(
	tz: string,
	q: {
		type?: string | null;
		petId?: string | null;
		duration?: string | null;
		skills?: string | null;
	}
): LogFormValues {
	const now = localParts(new Date(), tz);
	return {
		type: ['TRAINING', 'NOTE', 'HEALTH', 'WALK'].includes(q.type ?? '') ? q.type! : 'TRAINING',
		petId: q.petId ?? '',
		date: now.date,
		time: now.time,
		durationMin: q.duration ?? '',
		rating: '',
		body: '',
		tags: [],
		skillIds: q.skills ? q.skills.split(',').filter(Boolean) : [],
		newSkills: [],
		clientId: '',
		levels: {}
	};
}

export function entryToValues(
	e: Awaited<ReturnType<typeof entryOr404>>,
	tz: string
): LogFormValues {
	const at = localParts(e.occurredAt, tz);
	return {
		type: e.type,
		petId: e.petId,
		date: at.date,
		time: at.time,
		durationMin: e.durationMin?.toString() ?? '',
		rating: e.rating?.toString() ?? '',
		body: e.body ?? '',
		tags: e.tags,
		skillIds: e.skills.map((s) => s.skillId),
		newSkills: [],
		clientId: e.clientId ?? '',
		levels: {}
	};
}

/** Create (entryId null) or update an entry from a form. Skills typed in are created for the dog. */
export async function saveEntry(
	request: Request,
	ctx: { householdId: string; userId: string; tz: string; entryId: string | null }
) {
	const form = await request.formData();
	const { raw, data, errors } = parseLogForm(form);
	const photo = form.get('photo') instanceof File ? (form.get('photo') as File) : null;
	const photoErr = photoProblem(photo);
	if (photoErr) errors.photo = photoErr;
	const pet = data
		? await prisma.pet.findFirst({ where: { id: data.petId, householdId: ctx.householdId } })
		: null;
	if (data && !pet) errors.petId = 'Pick a dog.';
	if (!data || !pet || Object.keys(errors).length) return fail(400, { values: raw, errors });

	// Offline entries carry a clientId; if it's already saved, don't save it twice.
	if (!ctx.entryId && data.clientId) {
		const existing = await prisma.logEntry.findUnique({ where: { clientId: data.clientId } });
		if (existing) redirect(303, `/log/${existing.id}`);
	}

	const isTraining = data.type === 'TRAINING';
	const skillIds = isTraining
		? (
				await prisma.skill.findMany({
					where: { id: { in: data.skillIds }, petId: pet.id },
					select: { id: true }
				})
			).map((s) => s.id)
		: [];
	if (isTraining) {
		for (const name of new Set(data.newSkills.map((n) => n.replace(/\s+/g, ' ')))) {
			const skill = await prisma.skill.upsert({
				where: { petId_name: { petId: pet.id, name } },
				create: { petId: pet.id, name },
				update: {}
			});
			if (!skillIds.includes(skill.id)) skillIds.push(skill.id);
		}
	}

	const fields = {
		type: data.type,
		petId: pet.id,
		occurredAt: zonedToUtc(data.date, data.time, ctx.tz),
		durationMin: data.type === 'TRAINING' || data.type === 'WALK' ? data.durationMin : null,
		rating: isTraining ? data.rating : null,
		body: data.body,
		tags: data.type === 'HEALTH' ? data.tags : []
	};
	const entry = ctx.entryId
		? await prisma.logEntry.update({ where: { id: ctx.entryId }, data: fields })
		: await prisma.logEntry.create({
				data: { ...fields, authorId: ctx.userId, clientId: data.clientId }
			});

	await prisma.logEntrySkill.deleteMany({ where: { logEntryId: entry.id } });
	if (skillIds.length)
		await prisma.logEntrySkill.createMany({
			data: skillIds.map((skillId) => ({ logEntryId: entry.id, skillId }))
		});

	// "How's recall going?" level changes made while logging, recorded for the progress history.
	for (const [skillId, to] of Object.entries(raw.levels)) {
		if (!skillIds.includes(skillId) || !levels.includes(to as SkillLevelKey)) continue;
		await setSkillLevel(skillId, to as SkillLevelKey, ctx.userId, entry.id);
	}

	if (photo && photo.size > 0) {
		await savePhoto(photo, {
			householdId: ctx.householdId,
			petId: pet.id,
			userId: ctx.userId,
			logEntryId: entry.id
		});
	}
	redirect(303, ctx.entryId ? `/log/${entry.id}` : '/log');
}

export async function setSkillLevel(
	skillId: string,
	to: SkillLevelKey,
	userId: string,
	logEntryId?: string
) {
	const skill = await prisma.skill.findUniqueOrThrow({ where: { id: skillId } });
	if (skill.level === to) return;
	await prisma.$transaction([
		prisma.skill.update({ where: { id: skillId }, data: { level: to } }),
		prisma.skillLevelChange.create({
			data: { skillId, from: skill.level, to, byId: userId, logEntryId }
		})
	]);
}

export async function deleteEntry(id: string) {
	const files = await prisma.file.findMany({
		where: { logEntryId: id },
		select: { id: true, pathname: true }
	});
	await deleteFiles(files);
	await prisma.logEntry.delete({ where: { id } });
}

/** Feed rows, newest first, shaped for the page. */
export async function feed(
	householdId: string,
	tz: string,
	filter: { petId?: string | null; type?: string | null; skillId?: string | null },
	take = 60
) {
	const rows = await prisma.logEntry.findMany({
		where: {
			pet: { householdId },
			...(filter.petId ? { petId: filter.petId } : {}),
			...(filter.type && ['TRAINING', 'NOTE', 'HEALTH', 'WALK'].includes(filter.type)
				? { type: filter.type as 'TRAINING' }
				: {}),
			...(filter.skillId ? { skills: { some: { skillId: filter.skillId } } } : {})
		},
		orderBy: { occurredAt: 'desc' },
		take,
		include: entryInclude
	});
	return rows.map((e) => toView(e, tz));
}

export function toView(e: Awaited<ReturnType<typeof entryOr404>>, tz: string) {
	const at = localParts(e.occurredAt, tz);
	return {
		id: e.id,
		type: e.type,
		pet: e.pet,
		author: e.author?.givenName ?? 'Someone',
		date: at.date,
		time: at.time,
		durationMin: e.durationMin,
		rating: e.rating,
		body: e.body,
		tags: e.tags,
		skills: e.skills.map((s) => s.skill),
		photos: e.files.map((f) => f.id),
		levelUps: e.levelChanges.map((c) => ({ skill: c.skill.name, to: c.to }))
	};
}
export type EntryView = ReturnType<typeof toView>;
