
import { PrismaClient } from '../lib/generated/auth';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.POSTGRES_PRISMA_URL;

async function simulateLogin() {
    if (!DATABASE_URL) return;
    const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });

    const username = 'admin';
    const password = 'admin';

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`User: ${user.username}`);
        console.log(`Role: ${user.role}`);
        console.log(`Password Match: ${isMatch}`);

        if (isMatch) {
            console.log('✅ Login simulation SUCCESS');
        } else {
            console.log('❌ Login simulation FAILED (Password mismatch)');
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

simulateLogin();
