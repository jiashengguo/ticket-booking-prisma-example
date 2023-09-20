import { PrismaClient } from "@prisma/client";
import { withPolicy } from "@zenstackhq/runtime";
import { randomUUID } from "crypto";

async function test() {
    const prisma = new PrismaClient({});
    const client = withPolicy(prisma, { user: { id: 1 } });

    const myCorseIds = [randomUUID()];
    const result = await client.enrollment.count({
        where: {
            course_id: {
                in: myCorseIds,
            },
        },
    });
}

test();
