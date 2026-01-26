const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('PrismaClient 초기화 시도 중...');
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('성공: 데이터베이스 연결 확인됨', result);
    } catch (e) {
        console.error('실패: PrismaClient 초기화 오류:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
