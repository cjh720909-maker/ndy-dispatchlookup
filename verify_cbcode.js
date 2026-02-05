
const { PrismaClient } = require('./lib/generated/logistics');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.MYSQL_DATABASE_URL
        }
    }
});

async function main() {
    const dateStr = '2026-02-02';
    const allOrders = await prisma.order.findMany({
        where: { date: dateStr }
    });

    console.log('Total Orders:', allOrders.length);
    const withCbCode = allOrders.filter(o => o.cbCode);
    console.log('Orders with cbCode:', withCbCode.length);

    if (withCbCode.length > 0) {
        console.log('Sample CbCode:', withCbCode[0].cbCode);
    } else {
        console.log('Sample Order Keys:', Object.keys(allOrders[0]));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
