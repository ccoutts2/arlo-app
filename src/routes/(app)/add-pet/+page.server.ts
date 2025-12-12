import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { redirect, type Actions } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { put } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';


const schema = z.object({
    name: z.string().min(1, "Please enter a name."),
    breed: z.string().min(1, "Please enter a breed."),
    weight: z.number().optional(),
    birthday: z.preprocess(
        (a) => (a === '' ? undefined : a),
        z.coerce.date().optional()
    ),
    sex: z.enum(['Female', 'Male']).optional(),
    neutered: z.string().optional(),
    allergies: z.string().optional(),
    image: z.instanceof(File).optional(),
})

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod4(schema));

    return {
        form
    }
}


export const actions = {
    default: async ({request, locals}) => {
        const form = await superValidate(request, zod4(schema));
        const ownerId = locals.user?.id;

           if (!form.valid) {
			return message(form, {
				status: 'invalid',
				text: 'Form was invalid. Please check the form for errors.'
			});
		}

        if (!ownerId) {
            return redirect(302, "/auth/login")
        }

        const file = form.data.image as File;
        let imageUrl; 

       if (file && file.size > 0) {
            try {
                const uploadedBlob = await put(file.name, file, {
                    access: 'public',
                    addRandomSuffix: true,
                    token: BLOB_READ_WRITE_TOKEN,
                });
                imageUrl = uploadedBlob.url;
            } catch (error) {
                 console.log(error);
                 return message(form, { status: 'error', text: 'Failed to upload image.' }, { status: 500 });
            }
        }

        try {

            await prisma.pet.create({
                data: {
                    name: form.data.name,
                    breed: form.data.breed,
                    weight: form.data.weight,
                    birthday: form.data.birthday,
                    sex: form.data.sex,
                    neutered: form.data.neutered === 'yes',
                    allergies: form.data.allergies,
                    image: imageUrl,
                    ownerId: ownerId
                }
            })

        } catch(error) {
            console.log(error);
            
            return message(form,
				{
					status: 'error',
					text: 'Something went wrong. Please try again.'
				},
				{
					status: 500
				},

            )
        }
    }
} satisfies Actions;