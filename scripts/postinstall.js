const { execSync } = require('child_process');

function run(command) {
    console.log(`실행 중: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`명령어 실행 실패: ${command}`);
        process.exit(1);
    }
}

// Vercel 환경인지 확인
const isVercel = process.env.VERCEL === '1';

console.log(`환경 체크: ${isVercel ? 'Vercel(운영)' : '로컬(개발)'}`);

if (isVercel || process.env.POSTGRES_PRISMA_URL || process.env.FORCE_POSTGRES_BUILD) {
    // 운영 환경: Postgres 스키마 사용
    run('npx prisma generate --schema=./prisma/auth/schema.postgresql.prisma');
    run('npx prisma generate --schema=./prisma/logistics/schema.prisma');
} else {
    // 로컬 환경: SQLite 스키마 사용
    run('npx prisma generate --schema=./prisma/auth/schema.prisma');
    run('npx prisma generate --schema=./prisma/logistics/schema.prisma');
}

console.log('Prisma 클라이언트 생성 완료!');
