import { Lucia } from "lucia";
import prisma from "../../prisma/database";

import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

// const adapter = new PrismaAdapter(prisma.session, prisma.user);

// export const lucia = new Lucia(adapter,{
//     sessionCookie:{
//         name:"somu-auth-cookie",
//         expires: false,
//         attributes:{
//             secure: false
//         }
//     }
// });
