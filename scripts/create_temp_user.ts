
import { authDb } from '../lib/db';
import bcrypt from 'bcryptjs';

async function createTempUser() {
    const username = 'ndy';
    const password = '2026';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating user: ${username}...`);

    try {
        const user = await authDb.user.upsert({
            where: { username: username },
            update: { password: hashedPassword },
            create: {
                username: username,
                password: hashedPassword,
                companyName: 'LocalDev',
            },
        });
        console.log(`✅ User created: ${user.username}`);
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await authDb.$disconnect();
    }
}

createTempUser();
