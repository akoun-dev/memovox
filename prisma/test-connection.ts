import { PrismaClient } from '@prisma/client';

async function testConnection() {
  try {
    const prisma = new PrismaClient();
    console.log('Testing Prisma connection...');
    
    // Test simple query
    const users = await prisma.user.findMany({
      take: 5
    });
    
    console.log('✅ Connection successful!');
    console.log(`Found ${users.length} users in database`);
    
    if (users.length > 0) {
      console.log('Sample user:', users[0].email);
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testConnection();