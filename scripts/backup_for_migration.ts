import { PrismaClient } from '../lib/generated/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    try {
        const users = await prisma.user.findMany();
        const dailyRegistrations = await prisma.dailyDriverRegistration.findMany();
        const transportDrivers = await prisma.transportDriver.findMany();
        const vehicleInfos = await prisma.vehicleInfo.findMany();
        const deliverySequences = await prisma.deliverySequence.findMany();

        const backupData = {
            users,
            dailyRegistrations,
            transportDrivers,
            vehicleInfos,
            deliverySequences,
            timestamp: new Date().toISOString(),
            schema: 'ndy_auth'
        };

        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const backupPath = path.join(process.cwd(), 'data', fileName);

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`Backup completed: ${backupPath}`);
    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
