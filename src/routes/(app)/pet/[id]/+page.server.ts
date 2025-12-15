import prisma from "$lib/server/prisma";
import type { PageServerLoad } from "./$types";


export const load: PageServerLoad = async ({ params }) => {

    const petId = Number(params.id);


        const petDetails = await prisma.pet.findUnique({
        where: { id: petId },
        include: {
            reminders: true
        }
    })

    return {
        petDetails
    }
}
