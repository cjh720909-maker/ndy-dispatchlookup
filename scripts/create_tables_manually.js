const { PrismaClient } = require('../lib/generated/auth');

const prisma = new PrismaClient();

async function createTables() {
    const queries = [
        `CREATE SCHEMA IF NOT EXISTS "prj_dispatch_lookup"`,
        `CREATE TABLE IF NOT EXISTS "prj_dispatch_lookup"."NDL_User" (
      "id" SERIAL PRIMARY KEY,
      "username" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'customer',
      "companyName" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
        `CREATE TABLE IF NOT EXISTS "prj_dispatch_lookup"."NDL_DailyDriverRegistration" (
      "id" SERIAL PRIMARY KEY,
      "date" TEXT NOT NULL,
      "driverName" TEXT NOT NULL,
      "transportCompany" TEXT NOT NULL,
      "vehicleNumber" TEXT,
      "phoneNumber" TEXT,
      "realDriverName" TEXT,
      "isRegistered" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE("date", "driverName", "transportCompany")
    )`,
        `CREATE TABLE IF NOT EXISTS "prj_dispatch_lookup"."NDL_TransportDriver" (
      "id" SERIAL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "phoneNumber" TEXT NOT NULL,
      "vehicleNumber" TEXT,
      "transportCompany" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE("name", "phoneNumber", "transportCompany")
    )`,
        `CREATE TABLE IF NOT EXISTS "prj_dispatch_lookup"."NDL_VehicleInfo" (
      "id" SERIAL PRIMARY KEY,
      "driverName" TEXT UNIQUE NOT NULL,
      "vehicleType" TEXT NOT NULL DEFAULT 'fixed',
      "transportCompany" TEXT,
      "phoneNumber" TEXT,
      "memo" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
        `CREATE TABLE IF NOT EXISTS "prj_dispatch_lookup"."NDL_DeliverySequence" (
      "id" SERIAL PRIMARY KEY,
      "date" TEXT NOT NULL,
      "driverName" TEXT NOT NULL,
      "cbCode" TEXT NOT NULL,
      "sequence" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE("date", "driverName", "cbCode")
    )`
    ];

    try {
        console.log('Creating schema and tables in prj_dispatch_lookup...');
        for (const query of queries) {
            await prisma.$executeRawUnsafe(query);
        }
        console.log('All tables created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTables();
