const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Creating t_user table if not exists...");
    await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_user (
      U_IDX INT AUTO_INCREMENT PRIMARY KEY,
      U_ID VARCHAR(191) NOT NULL,
      U_PW VARCHAR(191) NOT NULL,
      U_COMPANY VARCHAR(191),
      U_CREATED_AT DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE INDEX t_user_U_ID_key(U_ID)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
    console.log("Table created created.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
