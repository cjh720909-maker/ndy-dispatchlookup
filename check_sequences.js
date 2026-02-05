
const { PrismaClient } = require('./lib/generated/auth');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.deliverySequence.findMany();
    console.log('--- DeliverySequence Table ---');
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
