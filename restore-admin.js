
const { PrismaClient } = require('./lib/generated/auth');
const bcrypt = require('bcryptjs');

async function restoreRemoteAdmin() {
    // 환경 변수에서 직접 가져옴
    let url = process.env.POSTGRES_PRISMA_URL;

    if (!url) {
        console.error('❌ Error: POSTGRES_PRISMA_URL is not defined in environment variables');
        process.exit(1);
    }

    if (!url.includes('schema=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}schema=ndy_auth`;
    }

    console.log('Connecting to Remote PostgreSQL...');

    const authDb = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    const username = 'admin';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await authDb.user.upsert({
            where: { username: username },
            update: {
                password: hashedPassword,
                role: 'admin',
                companyName: '시스템 관리자'
            },
            create: {
                username: username,
                password: hashedPassword,
                role: 'admin',
                companyName: '시스템 관리자',
            },
        });
        console.log(`✅ REMOTE Admin account restored: ${user.username}`);
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await authDb.$disconnect();
    }
}

restoreRemoteAdmin();
