const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = [
        { username: 'user1', password: 'password123', companyName: '하회' },
        { username: 'user2', password: 'password123', companyName: '대상' },
        { username: 'admin', password: 'adminpassword', companyName: null },
    ];

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                password: u.password,
                companyName: u.companyName,
            },
        });
        console.log(`Created user: ${user.username} (${user.companyName || 'Admin'})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
