import { PrismaClient } from "@prisma/client";
const client = new PrismaClient({});

async function bookSeat(userId: number) {
    // sleep randomly between 10ms and 100 ms
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));
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
            // This version field is the key; only claim seat if in-memory version matches database version,
            // indicating that the field has not been updated
            version: availableSeat.version,
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
    const actualCount = await client.seat.count({
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
