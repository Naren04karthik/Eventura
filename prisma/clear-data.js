const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️  Starting data cleanup...\n');

    // Delete in order respecting foreign key constraints
    // Delete child records first, then parent records

    console.log('Deleting bookmarks...');
    const bookmarks = await prisma.bookmark.deleteMany({});
    console.log(`✓ Deleted ${bookmarks.count} bookmarks`);

    console.log('Deleting registrations...');
    const registrations = await prisma.registration.deleteMany({});
    console.log(`✓ Deleted ${registrations.count} registrations`);

    console.log('Deleting events...');
    const events = await prisma.event.deleteMany({});
    console.log(`✓ Deleted ${events.count} events`);

    console.log('Deleting profiles...');
    const profiles = await prisma.profile.deleteMany({});
    console.log(`✓ Deleted ${profiles.count} profiles`);

    console.log('Deleting organizer requests...');
    const organizerRequests = await prisma.organizerRequest.deleteMany({});
    console.log(`✓ Deleted ${organizerRequests.count} organizer requests`);

    console.log('Deleting users...');
    const users = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${users.count} users`);

    console.log('Deleting colleges...');
    const colleges = await prisma.college.deleteMany({});
    console.log(`✓ Deleted ${colleges.count} colleges`);

    console.log('Deleting contact messages...');
    const contactMessages = await prisma.contact_messages.deleteMany({});
    console.log(`✓ Deleted ${contactMessages.count} contact messages`);

    console.log('Deleting admin requests...');
    const adminRequests = await prisma.adminRequest.deleteMany({});
    console.log(`✓ Deleted ${adminRequests.count} admin requests`);

    console.log('\n✅ All data cleared successfully!');
    console.log('📝 Database schema remains intact.');
    console.log('💡 You can now add fresh data from scratch.\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
