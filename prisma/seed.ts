import { PrismaClient } from '../lib/generated/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'password1234'; // 초기 비밀번호 (설치 후 변경 필요)
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('초기 계정 생성 시작...');

    const user = await prisma.user.upsert({
        where: { username: username },
        update: {},
        create: {
            username: username,
            password: hashedPassword,
            companyName: null, // Admin은 회사 구분 없음
        },
    });

    console.log(`계정 생성 완료: ${user.username}`);
    console.log(`초기 비밀번호: ${password}`);
    console.log('보안을 위해 첫 로그인 후 비밀번호를 변경해 주세요.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
