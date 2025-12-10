// import { validateSessionToken } from "$lib/server/session";
// import type { Handle } from "@sveltejs/kit";
// import { sequence } from "@sveltejs/kit/hooks";

// const authHandle: Handle = async({ event, resolve }) => {
//     const token = event.cookies.get('session') ?? null;

//     if (token === null) {
//         event.locals.user = null;
//         event.locals.session = null;

//         return resolve(event);
//     }

//     const { session, user } = validateSessionToken(token);

// }


// export const handle = sequence(authHandle);