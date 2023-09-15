import { PrismaClient } from "@prisma/client";
import { withPolicy } from "@zenstackhq/runtime";
const prisma = new PrismaClient({});

async function bookSeat(userId: number) {
    // sleep randomly between 10ms and 100 ms
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));

    const client = withPolicy(prisma, { user: { id: userId } });
    // Find the first available seat
    // availableSeat.version might be 0
    const availableSeat = await client.seat.findFirst({
        where: {
            claimedBy: null,
        },
        orderBy: [{ id: "asc" }],
    });

    if (!availableSeat) {
        throw new Error(`Oh no! all seats are booked.`);
    }

    // Only mark the seat as claimed if the availableSeat.version
    // matches the version we're updating. Additionally, increment the
    // version when we perform this update so all other clients trying
    // to book this same seat will have an outdated version.

    await client.seat.update({
        data: {
            userId: userId,
            version: {
                increment: 1,
            },
        },
        where: {
            id: availableSeat.id,
        },
    });
}

async function demonstrateLostUpdate() {
    let updatedCount = 0;
    let promises = [];
    for (let i = 0; i < 1200; i++) {
        promises.push(bookSeat(i));
    }

    await Promise.allSettled(promises)
        .then((values) => {
            updatedCount = values.filter((x) => x.status === "fulfilled").length;
        })
        .catch((err) => {
            console.error(err.message);
        });

    // Detect lost-updates
    const actualCount = await prisma.seat.count({
        where: {
            NOT: { claimedBy: null },
        },
    });
    console.log({
        updatedCountByUpdateMany: updatedCount,
        actualUpdatedCount: actualCount,
    });
    process.exit();
}

demonstrateLostUpdate();
