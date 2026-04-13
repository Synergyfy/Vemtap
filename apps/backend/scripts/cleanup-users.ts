import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { Business } from '../src/modules/businesses/entities/business.entity';
import { AuditLog } from '../src/modules/administration/entities/audit-log.entity';
import { DataSource, In } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const dataSource = app.get(DataSource);
  const businessRepo = dataSource.getRepository(Business);

  const emails = ['bljazeem@gmail.com', 'dev.azeem0@gmail.com'];

  console.log(`\n🚀 Starting cleanup for: ${emails.join(', ')}`);

  for (const email of emails) {
    try {
      const user = await usersService.findByEmail(email);
      if (!user) {
        console.log(`❓ User [${email}] not found. Skipping.`);
        continue;
      }

      console.log(`\n🔍 Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

      // 1. Check if user owns a business
      const business = await businessRepo.findOne({ 
        where: { ownerId: user.id },
        relations: ['branches'] 
      });

      if (business) {
        console.log(`🏢 User owns business: "${business.name}" (ID: ${business.id})`);
        
        const branchIds = business.branches?.map(b => b.id) || [];
        
        // 1.5 Clean up Audit Logs for the business and its branches
        console.log(`🧹 Cleaning up Audit Logs for business and branches...`);
        const auditLogRepo = dataSource.getRepository(AuditLog);
        await auditLogRepo.delete({ businessId: business.id });
        if (branchIds.length > 0) {
          await auditLogRepo.delete({ branchId: In(branchIds) });
        }
        
        console.log(`🗑️ Deleting business and all its branches (via CASCADE)...`);
        await businessRepo.remove(business);
        console.log(`✅ Business deleted.`);
      }

      // 1.6 Clean up Audit Logs where user was the actor
      console.log(`🧹 Cleaning up Audit Logs where user was the actor...`);
      await dataSource.getRepository(AuditLog).delete({ actorId: user.id });

      // 2. Delete the user
      // Note: Relation visits, messages, and threads are mostly set to CASCADE in their entities
      console.log(`👤 Deleting user: ${user.id}...`);
      await usersService.adminDeleteUser(user.id);
      console.log(`✅ User [${email}] successfully removed.`);

    } catch (error) {
      console.error(`❌ Error deleting [${email}]:`, error.message);
    }
  }

  console.log('\n✨ Cleanup complete!');
  await app.close();
}

bootstrap();
