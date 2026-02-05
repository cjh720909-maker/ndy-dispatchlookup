import { PrismaClient as PrismaClientAuth } from './generated/auth';
import { PrismaClient as PrismaClientLogistics } from './generated/logistics';
import path from 'path';

// 글로벌 네임스페이스에 인스턴스 저장
const globalForPrisma = global as unknown as {
    authDb: PrismaClientAuth;
    logisticsDb: PrismaClientLogistics;
};

// 환경에 따른 Auth DB URL 설정 (Vercel/운영 환경이면 PostgreSQL, 아니면 SQLite)
const isProduction = process.env.VERCEL === '1' || !!process.env.POSTGRES_PRISMA_URL;
const sqlitePath = path.resolve(process.cwd(), 'prisma/auth/auth.db');
const authDbUrl = isProduction ? process.env.POSTGRES_PRISMA_URL : `file:${sqlitePath}`;

console.log(`[DB Init] Auth DB 모드: ${isProduction ? 'PostgreSQL (Neon)' : 'SQLite (Local)'}`);
if (!isProduction) {
    console.log('[DB Init] Auth DB Path:', authDbUrl);
}

export const authDb =
    globalForPrisma.authDb ||
    new PrismaClientAuth({
        datasourceUrl: authDbUrl,
        log: ['error', 'warn'],
    });

export const logisticsDb =
    globalForPrisma.logisticsDb ||
    new PrismaClientLogistics({
        datasourceUrl: process.env.MYSQL_DATABASE_URL,
        log: ['error', 'warn'],
    });

// 최신 모델 반영을 위해 개발 환경에서 인스턴스 갱신 시 로그 출력
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.authDb = authDb;
    globalForPrisma.logisticsDb = logisticsDb;
}

// 모델 로딩 확인용 (디버깅)
console.log('[DB Init] Auth Models:', Object.keys(authDb).filter(k => !k.startsWith('_')));
