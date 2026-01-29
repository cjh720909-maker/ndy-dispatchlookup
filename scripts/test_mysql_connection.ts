
import { logisticsDb } from '../lib/db';

async function main() {
    console.log('Testing MySQL connection...');
    try {
        // Try to count orders or just connect
        const count = await logisticsDb.order.count();
        console.log(`✅ Connection Successful! Found ${count} orders in t_balju.`);
    } catch (e) {
        console.error('❌ Connection Failed:', e);
        process.exit(1);
    } finally {
        await logisticsDb.$disconnect();
    }
}

main();
