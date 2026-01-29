
import { authDb } from '../lib/db';

async function verify() {
  console.log('Verifying admin user...');
  try {
    const user = await authDb.user.findUnique({
      where: { username: 'admin' },
    });
    
    if (user) {
      console.log('✅ Admin user found:', user.username);
      // Optional: check password hash if needed, but existence is good first step
    } else {
      console.log('❌ Admin user NOT found.');
      process.exit(1); 
    }
  } catch (e) {
    console.error('Error querying DB:', e);
    process.exit(1);
  }
}

verify();
