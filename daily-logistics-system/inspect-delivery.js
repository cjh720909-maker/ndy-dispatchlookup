const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Get the first row of t_cust_bae to see all columns
        const result = await prisma.$queryRaw`SELECT * FROM t_cust_bae LIMIT 1`;
        console.log('t_cust_bae first row:', result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
