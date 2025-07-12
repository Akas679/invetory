import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function hashExistingPasswords() {
  try {
    console.log('Starting password hashing for existing users...');
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (!user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user: ${user.username}`);
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update the user with hashed password
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        console.log(`✓ Password hashed for user: ${user.username}`);
      } else {
        console.log(`✓ Password already hashed for user: ${user.username}`);
      }
    }
    
    console.log('Password hashing completed for all users!');
    
    // Verify the results
    const updatedUsers = await db.select({ id: users.id, username: users.username, password: users.password }).from(users);
    console.log('\nFinal verification:');
    updatedUsers.forEach(user => {
      console.log(`User: ${user.username} - Password starts with: ${user.password.substring(0, 10)}...`);
    });
    
  } catch (error) {
    console.error('Error hashing passwords:', error);
  }
}

// Run the script
hashExistingPasswords().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});