import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function fixAllPasswords() {
  try {
    console.log('Checking and fixing all passwords...');
    
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to check`);
    
    for (const user of allUsers) {
      console.log(`\nUser: ${user.username}`);
      console.log(`Current password: ${user.password}`);
      
      // If password doesn't start with $2b$ (bcrypt hash), hash it
      if (!user.password.startsWith('$2b$')) {
        console.log('❌ Password is in plain text - hashing now...');
        
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        console.log(`✅ Password hashed for ${user.username}`);
        console.log(`New hash: ${hashedPassword.substring(0, 20)}...`);
      } else {
        console.log('✅ Password already properly hashed');
      }
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    const finalUsers = await db.select().from(users);
    finalUsers.forEach(user => {
      const isHashed = user.password.startsWith('$2b$');
      console.log(`${user.username}: ${isHashed ? '✅ HASHED' : '❌ PLAIN TEXT'} - ${user.password.substring(0, 15)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAllPasswords().then(() => {
  console.log('\nPassword fixing completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});