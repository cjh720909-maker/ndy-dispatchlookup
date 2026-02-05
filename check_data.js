
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
    const orders = await prisma.order.findMany({
        where: { date: dateStr },
        include: {
            deliveryPoint: true
        }
    });

    console.log('Total Orders:', orders.length);

    const hasPhone = orders.filter(o =>
        o.deliveryPoint &&
        o.deliveryPoint.hp && o.deliveryPoint.hp !== '0' && o.deliveryPoint.hp.trim() !== ''
    );

    console.log('Orders with valid Phone/HP:', hasPhone.length);
    if (hasPhone.length > 0) {
        console.log('Sample Valid Order:', JSON.stringify(hasPhone[0], (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
        // Try CB_PHONE
        const hasLandline = orders.filter(o =>
            o.deliveryPoint &&
            o.deliveryPoint.phone && o.deliveryPoint.phone !== '0' && o.deliveryPoint.phone.trim() !== ''
        );
        console.log('Orders with valid Landline:', hasLandline.length);
        if (hasLandline.length > 0) {
            console.log('Sample Valid Landline Order:', JSON.stringify(hasLandline[0], (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, 2));
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
