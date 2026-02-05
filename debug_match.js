
const { PrismaClient } = require('./lib/generated/logistics');
const iconv = require('iconv-lite');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.MYSQL_DATABASE_URL
        }
    }
});

function fromLegacy(str) {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

async function main() {
    const dateStr = '2026-02-02';
    const orders = await prisma.order.findMany({
        where: { date: dateStr },
        take: 10
    });

    console.log('--- Sample Orders ---');
    for (const o of orders) {
        console.log({
            id: o.id,
            customerName: fromLegacy(o.customerName),
            cbCode: o.cbCode,
            decodedCbCode: fromLegacy(o.cbCode)
        });
    }

    const firstCbCode = orders[0].cbCode;
    const dps = await prisma.deliveryPoint.findMany({
        where: { code: firstCbCode }
    });

    console.log('\n--- Matching DeliveryPoints ---');
    console.log(JSON.stringify(dps, null, 2));

    // Try searching by name if code fails
    if (dps.length === 0) {
        console.log('\n--- Searching DP by NAME ---');
        const name = orders[0].customerName;
        const dpsByName = await prisma.deliveryPoint.findMany({
            where: { name: name }
        });
        console.log(JSON.stringify(dpsByName, (key, value) => fromLegacy(value), 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
