import { PrismaClient as PrismaClientAuth } from './generated/auth';
import { PrismaClient as PrismaClientLogistics } from './generated/logistics';
import path from 'path';

// 글로벌 네임스페이스에 인스턴스 저장
const globalForPrisma = global as unknown as {
    authDb: PrismaClientAuth;
    logisticsDb: PrismaClientLogistics;
};

// 환경에 따른 Auth DB URL 설정
// 모든 환경에서 PostgreSQL(Neon)을 기본으로 사용하도록 설정합니다. (격리 규칙 준수)
const isProduction = process.env.NODE_ENV === 'production';

console.log(`[DB Init] Auth DB 모드: PostgreSQL (Neon/prj_dispatch_lookup)`);

// 운영 환경(Vercel) 및 로컬 환경에서 POSTGRES_PRISMA_URL을 사용하고, 
// 주소에 schema 설정이 없으면 자동으로 prj_dispatch_lookup을 붙여줍니다.
const getAuthDbUrl = () => {
    let url = process.env.POSTGRES_PRISMA_URL;
    if (url && !url.includes('schema=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}schema=prj_dispatch_lookup`;
    }
    return url;
};

export const authDb =
    globalForPrisma.authDb ||
    new PrismaClientAuth({
        datasourceUrl: getAuthDbUrl(),
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
