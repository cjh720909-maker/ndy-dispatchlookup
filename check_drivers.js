
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
    const vehicles = await prisma.vehicle.findMany();
    const orders = await prisma.order.findMany({
        where: { date: dateStr }
    });

    const driverCodes = [...new Set(orders.map(o => o.driverName))];

    const outsourced = [];
    for (const code of driverCodes) {
        const v = vehicles.find(vh => vh.driverName === code);
        if (!v) continue;

        const vNo = fromLegacy(v.vehicleNo);
        const rName = fromLegacy(v.realDriverName);
        const phone = fromLegacy(v.driverPhone);

        if ((vNo.includes('이룸') || vNo.includes('OUTSOURCED') || rName.includes('이룸') || rName.includes('OUTSOURCED')) && !phone.trim()) {
            outsourced.push({
                code: fromLegacy(code),
                originalCode: code,
                vNo,
                rName
            });
        }
    }

    console.log('Outsourced Drivers:', outsourced);

    if (outsourced.length > 0) {
        const firstOut = outsourced[0];
        const outOrders = await prisma.order.findMany({
            where: { date: dateStr, driverName: firstOut.originalCode },
            include: { deliveryPoint: true }
        });
        console.log(`Orders for ${firstOut.code}:`, outOrders.length);
        const withPhone = outOrders.filter(o => o.deliveryPoint && (o.deliveryPoint.hp || o.deliveryPoint.phone));
        console.log(`Orders with Phone info for ${firstOut.code}:`, withPhone.length);
        if (withPhone.length > 0) {
            const detail = withPhone[0].deliveryPoint;
            console.log('Sample detail:', {
                customer: fromLegacy(withPhone[0].customerName),
                address: fromLegacy(detail.address),
                hp: fromLegacy(detail.hp),
                phone: fromLegacy(detail.phone)
            });
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
