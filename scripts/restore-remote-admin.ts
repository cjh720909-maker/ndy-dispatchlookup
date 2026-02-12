
import { PrismaClient as PrismaClientAuth } from '../lib/generated/auth';
import bcrypt from 'bcryptjs';

async function restoreRemoteAdmin() {
    // lib/db.ts의 로직과 동일하게 스키마 설정 포함
    let url = process.env.POSTGRES_PRISMA_URL;
    if (url && !url.includes('schema=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}schema=ndy_auth`;
    }

    if (!url) {
        console.error('❌ Error: POSTGRES_PRISMA_URL is not defined in .env');
        return;
    }

    console.log('Connecting to Remote PostgreSQL (Neon)...');

    const authDb = new PrismaClientAuth({
        datasourceUrl: url,
        log: ['info', 'error', 'warn'],
    });

    const username = 'admin';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Setting up admin user on REMOTE DB: ${username}...`);

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
        console.log(`✅ REMOTE Admin account restored successfully: ${user.username} (Role: ${user.role})`);
    } catch (e) {
        console.error('❌ Error during remote restoration:', e);
    } finally {
        await authDb.$disconnect();
    }
}

restoreRemoteAdmin();
