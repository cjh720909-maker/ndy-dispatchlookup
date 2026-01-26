const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Run raw SQL to get column names of t_balju
        // Note: For MySQL
        const result = await prisma.$queryRaw`DESCRIBE t_balju`;
        console.log('--- Columns in t_balju ---');
        console.table(result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
