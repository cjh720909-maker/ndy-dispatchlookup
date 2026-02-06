
import { authDb } from '../lib/db';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
    const username = 'admin';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Setting up admin user: ${username}...`);

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
        console.log(`✅ Admin account configured: ${user.username} (Role: ${user.role})`);
    } catch (e) {
        console.error('❌ Error setting up admin user:', e);
    } finally {
        await authDb.$disconnect();
    }
}

setupAdmin();
