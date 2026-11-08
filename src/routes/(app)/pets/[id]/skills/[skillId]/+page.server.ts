import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember, petOr404 } from '$lib/server/access';
import { skillOr404 } from '$lib/server/skills';
import { setSkillLevel } from '$lib/server/log';
import { levels, type SkillLevelKey } from '$lib/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { householdId, tz } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	const skill = await skillOr404(householdId, pet.id, params.skillId);
	const [changes, sessions] = await Promise.all([
		prisma.skillLevelChange.findMany({
			where: { skillId: skill.id },
			orderBy: { at: 'desc' },
			include: { by: { select: { givenName: true } } }
		}),
		prisma.logEntrySkill.count({ where: { skillId: skill.id } })
	]);
	const day = (d: Date) =>
		d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: tz });
	return {
		pet: { id: pet.id, name: pet.name },
		skill: {
			id: skill.id,
			name: skill.name,
			level: skill.level,
			steps: skill.steps.map((s) => ({
				id: s.id,
				text: s.text,
				done: Boolean(s.doneAt),
				by: s.doneBy?.givenName ?? null,
				when: s.doneAt ? day(s.doneAt) : null
			}))
		},
		sessions,
		changes: changes.map((c) => ({
			id: c.id,
			from: c.from,
			to: c.to,
			by: c.by?.givenName ?? 'Someone',
			when: day(c.at)
		}))
	};
};

async function ctx(locals: App.Locals, params: { id: string; skillId: string }) {
	const { householdId, user } = await requireMember(locals);
	const pet = await petOr404(householdId, params.id);
	const skill = await skillOr404(householdId, pet.id, params.skillId);
	return { user, skill };
}

export const actions = {
	level: async ({ locals, params, request }) => {
		const { user, skill } = await ctx(locals, params);
		const to = String((await request.formData()).get('level'));
		if (!levels.includes(to as SkillLevelKey)) return fail(400);
		await setSkillLevel(skill.id, to as SkillLevelKey, user.id);
		return { ok: true };
	},
	addStep: async ({ locals, params, request }) => {
		const { skill } = await ctx(locals, params);
		const text = String((await request.formData()).get('text') ?? '').trim();
		if (!text || text.length > 120)
			return fail(400, { stepError: 'Write a short step, under 120 characters.' });
		const max = skill.steps.at(-1)?.position ?? 0;
		await prisma.skillStep.create({ data: { skillId: skill.id, text, position: max + 1 } });
		return { ok: true };
	},
	toggleStep: async ({ locals, params, request }) => {
		const { user, skill } = await ctx(locals, params);
		const id = String((await request.formData()).get('id'));
		const step = skill.steps.find((s) => s.id === id);
		if (!step) return fail(404);
		await prisma.skillStep.update({
			where: { id },
			data: step.doneAt
				? { doneAt: null, doneById: null }
				: { doneAt: new Date(), doneById: user.id }
		});
		return { ok: true };
	},
	removeStep: async ({ locals, params, request }) => {
		const { skill } = await ctx(locals, params);
		const id = String((await request.formData()).get('id'));
		await prisma.skillStep.deleteMany({ where: { id, skillId: skill.id } });
		return { ok: true };
	},
	delete: async ({ locals, params }) => {
		const { skill } = await ctx(locals, params);
		await prisma.skill.delete({ where: { id: skill.id } });
		redirect(303, `/pets/${params.id}`);
	}
} satisfies Actions;
