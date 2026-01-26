const { PrismaClient } = require('@prisma/client');
const iconv = require('iconv-lite');

const prisma = new PrismaClient();

function fromLegacy(str) {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

function toLegacy(str) {
    try { return iconv.encode(str, 'euc-kr').toString('binary'); } catch (e) { return str; }
}

async function main() {
    console.log('--- Debugging DB Content ---');
    try {
        const count = await prisma.order.count();
        console.log(`Total Orders: ${count}`);

        if (count > 0) {
            const orders = await prisma.order.findMany({ take: 5 });
            console.log('Sample Orders:');
            for (const o of orders) {
                console.log(`ID: ${o.id}, Customer(Raw): ${o.customerName}, Customer(Decoded): ${fromLegacy(o.customerName)}`);
            }
        } else {
            console.log('No orders found.');
        }

        const testTerm = '대상'; // Example company
        const legacyTerm = toLegacy(testTerm);
        console.log(`\nSearching for '${testTerm}' (Legacy: ${Buffer.from(legacyTerm, 'binary').toString('hex')})`);

        const match = await prisma.order.findFirst({
            where: {
                customerName: { contains: legacyTerm }
            }
        });

        if (match) {
            console.log('Match FOUND using legacy encoding!');
        } else {
            console.log('Match NOT found using legacy encoding.');

            // Try UTF-8 search
            const matchUtf8 = await prisma.order.findFirst({
                where: {
                    customerName: { contains: testTerm }
                }
            });
            if (matchUtf8) {
                console.log('Match FOUND using UTF-8 (Standard)! This implies encoding mismatch in code.');
            } else {
                console.log('Match NOT found using UTF-8 either.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
