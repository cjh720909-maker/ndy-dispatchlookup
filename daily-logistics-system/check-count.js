const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const count = await prisma.order.count(); console.log('Count:', count); } main();
