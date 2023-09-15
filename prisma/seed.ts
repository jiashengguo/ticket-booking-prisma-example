import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);
    await prisma.seat.deleteMany();
    await prisma.user.deleteMany();

    for (let i = 0; i < 1200; i++) {
        await prisma.user.create({
            data: {
                id: i,
            },
        });
    }
    for (let i = 0; i < 1000; i++) {
        await prisma.seat.create({
            data: {
                id: i,
                version: 0,
            },
        });
    }
    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
