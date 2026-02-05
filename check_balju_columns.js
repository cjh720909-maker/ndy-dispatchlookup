
const { PrismaClient } = require('./lib/generated/logistics');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.MYSQL_DATABASE_URL
        }
    }
});

async function main() {
    const result = await prisma.$queryRaw`DESCRIBE t_balju`;
    console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
