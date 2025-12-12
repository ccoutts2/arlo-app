import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from './$types';
import prisma from "$lib/server/prisma";

export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, "/auth/login")
    }

    const user = locals.user.givenName;
    const ownerId = locals.user.id;

    const pets = await prisma.pet.findMany({
        where: { ownerId: ownerId }
    })

    return {
        user,    
        pets
    }
}       