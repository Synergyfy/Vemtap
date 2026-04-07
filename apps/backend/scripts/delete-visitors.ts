import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Visit } from '../src/modules/visitors/entities/visit.entity';
import { CatalogueOrder } from '../src/modules/catalogue-orders/entities/catalogue-order.entity';
import { PointTransaction } from '../src/modules/loyalty/entities/point-transaction.entity';
import { RedemptionCode } from '../src/modules/loyalty/entities/redemption-code.entity';
import { Contact } from '../src/modules/contacts/entities/contact.entity';
import { Message } from '../src/modules/messaging/entities/message.entity';
import { MessageLog } from '../src/modules/messaging/entities/message-log.entity';
import { ConversationThread } from '../src/modules/messaging/entities/conversation-thread.entity';
import { DataSource, In } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepository = dataSource.getRepository(User);
  const visitRepository = dataSource.getRepository(Visit);
  const orderRepository = dataSource.getRepository(CatalogueOrder);
  const pointTransactionRepository = dataSource.getRepository(PointTransaction);
  const redemptionCodeRepository = dataSource.getRepository(RedemptionCode);
  const contactRepository = dataSource.getRepository(Contact);
  const messageRepository = dataSource.getRepository(Message);
  const messageLogRepository = dataSource.getRepository(MessageLog);
  const threadRepository = dataSource.getRepository(ConversationThread);

  console.log('🔍 Finding all visitors (role: Customer)...');
  const visitors = await userRepository.find({
    where: { role: UserRole.CUSTOMER }
  });

  if (visitors.length === 0) {
    console.log('✅ No visitors found. Nothing to delete.');
    await app.close();
    return;
  }

  const visitorIds = visitors.map(v => v.id);
  const visitorEmails = visitors.map(v => v.email).filter(Boolean);
  const visitorPhones = visitors.map(v => v.phone).filter(Boolean);

  console.log(`📊 Found ${visitors.length} visitors.`);

  try {
    // We use a transaction to ensure all associated data is removed safely.
    await dataSource.transaction(async (transactionalEntityManager) => {
      console.log('\n🧹 Deleting associated data...');

      // 1. Delete Orders (Order Items should cascade delete via CatalogueOrder)
      const orderCountBefore = await orderRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`📦 Deleting ${orderCountBefore} orders...`);
      await transactionalEntityManager.delete(CatalogueOrder, { customerId: In(visitorIds) });

      // 2. Delete Visits
      const visitCountBefore = await visitRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`🚶 Deleting ${visitCountBefore} visits...`);
      await transactionalEntityManager.delete(Visit, { customerId: In(visitorIds) });

      // 3. Delete Loyalty Data
      const ptCount = await pointTransactionRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`💎 Deleting ${ptCount} point transactions...`);
      await transactionalEntityManager.delete(PointTransaction, { customerId: In(visitorIds) });

      // Redemption codes can be linked to creators or users who used them
      const rcUsedCount = await redemptionCodeRepository.count({ where: { usedById: In(visitorIds) } });
      const rcCreatedCount = await redemptionCodeRepository.count({ where: { createdById: In(visitorIds) } });
      console.log(`🎫 Deleting ${rcUsedCount + rcCreatedCount} related redemption codes...`);
      await transactionalEntityManager.delete(RedemptionCode, { usedById: In(visitorIds) });
      await transactionalEntityManager.delete(RedemptionCode, { createdById: In(visitorIds) });

      // 4. Delete Messaging Data
      const messageCount = await messageRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`💬 Deleting ${messageCount} messages...`);
      await transactionalEntityManager.delete(Message, { customerId: In(visitorIds) });

      const threadCount = await threadRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`🧵 Deleting ${threadCount} threads...`);
      await transactionalEntityManager.delete(ConversationThread, { customerId: In(visitorIds) });

      const logCount = await messageLogRepository.count({ where: { customerId: In(visitorIds) } });
      console.log(`🗒️ Deleting ${logCount} message logs...`);
      await transactionalEntityManager.delete(MessageLog, { customerId: In(visitorIds) });

      // 5. Delete Contacts (matched by email or phone of the visitors)
      let contactCount = 0;
      const contactWhere: any = [];
      if (visitorEmails.length > 0) contactWhere.push({ email: In(visitorEmails) });
      if (visitorPhones.length > 0) contactWhere.push({ phone: In(visitorPhones) });
      
      if (contactWhere.length > 0) {
          contactCount = await contactRepository.count({ where: contactWhere });
          console.log(`📞 Deleting ${contactCount} contacts...`);
          await transactionalEntityManager.delete(Contact, contactWhere);
      }

      // 6. Finally, delete the users
      console.log(`👤 Deleting ${visitors.length} user accounts...`);
      await transactionalEntityManager.delete(User, { id: In(visitorIds) });
    });

    console.log('\n✨ Cleanup complete! All visitor data removed.');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
  }

  await app.close();
}

bootstrap();
