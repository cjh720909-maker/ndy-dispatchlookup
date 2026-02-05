import { PrismaClient as PrismaClientAuth } from './generated/auth';
import { PrismaClient as PrismaClientLogistics } from './generated/logistics';
import path from 'path';

// 글로벌 네임스페이스에 인스턴스 저장
const globalForPrisma = global as unknown as {
    authDb: PrismaClientAuth;
    logisticsDb: PrismaClientLogistics;
};

// 환경에 따른 Auth DB URL 설정
// Vercel 환경에서만 PostgreSQL(운영)을 사용하고, 로컬 개발 시에는 SQLite를 우선합니다.
const isProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

console.log(`[DB Init] Auth DB 모드: ${isProduction ? 'PostgreSQL (Neon)' : 'SQLite (Local)'}`);
if (!isProduction) {
    console.log('[DB Init] Auth DB URL (from ENV):', process.env.AUTH_DATABASE_URL);
}

export const authDb =
    globalForPrisma.authDb ||
    new PrismaClientAuth({
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
