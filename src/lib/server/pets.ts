import { fail, redirect } from '@sveltejs/kit';
import type { Pet } from '$lib/server/generated/prisma/client';
import { parsePetForm, type PetFormValues } from '$lib/schemas/pet';
import { isoDate } from '$lib/format';
import prisma from './prisma';
import { deleteFiles, photoProblem, savePhoto } from './files';

export const emptyPetValues: PetFormValues = {
	name: '',
	breed: '',
	sex: 'UNKNOWN',
	birthday: '',
	neutered: '',
	weightKg: '',
	microchip: '',
	allergies: '',
	note: '',
	sitterNotes: '',
	vetName: '',
	vetPhone: '',
	vetAddress: ''
};

export const petToValues = (p: Pet): PetFormValues => ({
	name: p.name,
	breed: p.breed ?? '',
	sex: p.sex,
	birthday: isoDate(p.birthday),
	neutered: p.neutered === null ? '' : p.neutered ? 'yes' : 'no',
	weightKg: p.weightKg?.toString() ?? '',
	microchip: p.microchip ?? '',
	allergies: p.allergies ?? '',
	note: p.note ?? '',
	sitterNotes: p.sitterNotes ?? '',
	vetName: p.vetName ?? '',
	vetPhone: p.vetPhone ?? '',
	vetAddress: p.vetAddress ?? ''
});

/** Shared create/update action body. `petId` null creates. */
export async function savePet(
	request: Request,
	ctx: { householdId: string; userId: string; petId: string | null }
) {
	const form = await request.formData();
	const { raw, data, errors } = parsePetForm(form);
	const photo = form.get('photo') instanceof File ? (form.get('photo') as File) : null;
	const photoErr = photoProblem(photo);
	if (photoErr) errors.photo = photoErr;
	if (!data || Object.keys(errors).length) return fail(400, { values: raw, errors });

	const fields = { ...data, birthday: data.birthday ? new Date(data.birthday) : null };
	const pet = ctx.petId
		? await prisma.pet.update({ where: { id: ctx.petId }, data: fields, include: { photo: true } })
		: await prisma.pet.create({
				data: { ...fields, householdId: ctx.householdId },
				include: { photo: true }
			});

	if (photo && photo.size > 0) {
		const file = await savePhoto(photo, {
			householdId: ctx.householdId,
			petId: pet.id,
			userId: ctx.userId
		});
		await prisma.pet.update({ where: { id: pet.id }, data: { photoId: file.id } });
		if (pet.photo) await deleteFiles([pet.photo]);
	}
	redirect(303, `/pets/${pet.id}`);
}

export async function deletePet(petId: string) {
	const files = await prisma.file.findMany({
		where: { petId },
		select: { id: true, pathname: true }
	});
	await deleteFiles(files);
	await prisma.pet.delete({ where: { id: petId } });
}
