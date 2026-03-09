const { PrismaClient } = require('../lib/generated/auth');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const prisma = new PrismaClient();

    try {
        // 1. 백업 데이터 로드
        const backupFiles = fs.readdirSync(path.join(__dirname, '..', 'data'))
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .sort()
            .reverse();

        if (backupFiles.length === 0) {
            console.error('No backup file found in data/');
            return;
        }

        const latestBackup = backupFiles[0];
        const backupData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', latestBackup), 'utf-8'));
        console.log(`Loading backup: ${latestBackup}`);

        // 2. 테이블 생성 (만약 없다면) - db push 대신 raw query 사용 권장되나, 
        // 여기서는 NeonDB의 특성상 스키마가 비어있을 수 있으므로 
        // 안전하게 데이터를 하나씩 넣는 방식으로 진행 (Prisma가 테이블이 없으면 에러를 낼 것이므로 먼저 확인 필요)

        // 주의: 최팀장님 지시사항에 따라 db push 금지이므로, 
        // 테이블이 이미 존재한다고 가정하거나 raw query로 안전하게 생성해야 함.
        // 여기서는 기존 데이터를 신규 스키마로 이관하는 것이 목적.

        console.log('Migrating data to prj_dispatch_lookup...');

        // User 이관
        if (backupData.users) {
            for (const item of backupData.users) {
                await prisma.user.upsert({
                    where: { id: item.id },
                    update: item,
                    create: item
                });
            }
            console.log(`Migrated ${backupData.users.length} users.`);
        }

        // DailyDriverRegistration 이관
        if (backupData.dailyRegistrations) {
            for (const item of backupData.dailyRegistrations) {
                await prisma.dailyDriverRegistration.upsert({
                    where: { id: item.id },
                    update: item,
                    create: item
                });
            }
            console.log(`Migrated ${backupData.dailyRegistrations.length} dailyRegistrations.`);
        }

        // TransportDriver 이관
        if (backupData.transportDrivers) {
            for (const item of backupData.transportDrivers) {
                await prisma.transportDriver.upsert({
                    where: { id: item.id },
                    update: item,
                    create: item
                });
            }
            console.log(`Migrated ${backupData.transportDrivers.length} transportDrivers.`);
        }

        // VehicleInfo 이관
        if (backupData.vehicleInfos) {
            for (const item of backupData.vehicleInfos) {
                await prisma.vehicleInfo.upsert({
                    where: { id: item.id },
                    update: item,
                    create: item
                });
            }
            console.log(`Migrated ${backupData.vehicleInfos.length} vehicleInfos.`);
        }

        // DeliverySequence 이관
        if (backupData.deliverySequences) {
            for (const item of backupData.deliverySequences) {
                await prisma.deliverySequence.upsert({
                    where: { id: item.id },
                    update: item,
                    create: item
                });
            }
            console.log(`Migrated ${backupData.deliverySequences.length} deliverySequences.`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        if (error.code === 'P2021') {
            console.error('Table does not exist. Please ensure tables are created in the new schema before migration.');
            console.error('Do NOT use prisma db push. Use a safe migration script or SQL commands.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
