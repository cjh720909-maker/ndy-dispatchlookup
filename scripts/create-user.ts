import { PrismaClient } from '../lib/generated/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser(username: string, password: string, companyName: string | null = null) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                companyName
            }
        });

        console.log(`성공: 계정이 생성되었습니다. (ID: ${user.username}, 회사: ${user.companyName || '없음'})`);
    } catch (error: any) {
        if (error.code === 'P2002') {
            console.error(`오류: 이미 존재하는 아이디입니다. (${username})`);
        } else {
            console.error('오류 발생:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// 명령줄 인자 처리: npx tsx scripts/create-user.ts [아이디] [비밀번호] [회사명(선택)]
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('사용법: npx tsx scripts/create-user.ts [아이디] [비밀번호] [회사명(선택)]');
    console.log('예시: npx tsx scripts/create-user.ts user1 pass123 "하회"');
    process.exit(1);
}

createUser(args[0], args[1], args[2] || null);
