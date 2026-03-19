import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import {
  Business,
} from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { ConversationThread, ThreadStatus } from '../../src/modules/messaging/entities/conversation-thread.entity';
import { Message } from '../../src/modules/messaging/entities/message.entity';
import { Visit } from '../../src/modules/visitors/entities/visit.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { Channel } from '../../src/modules/messaging/enums/channel.enum';
import * as bcrypt from 'bcrypt';

describe('Messaging Inbox (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let businessRepo: Repository<Business>;
  let branchRepo: Repository<Branch>;
  let threadRepo: Repository<ConversationThread>;
  let messageRepo: Repository<Message>;
  let visitRepo: Repository<Visit>;
  let authService: AuthService;

  let ownerToken: string;
  let visitorToken: string;
  let otherVisitorToken: string;
  let branchId: string;
  let customerId: string;
  let otherCustomerId: string;

  beforeAll(async () => {
    app = await createTestApp();

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    branchRepo = app.get(getRepositoryToken(Branch));
    threadRepo = app.get(getRepositoryToken(ConversationThread));
    messageRepo = app.get(getRepositoryToken(Message));
    visitRepo = app.get(getRepositoryToken(Visit));
    authService = app.get(AuthService);

    const testId = Date.now().toString();
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Owner & Business
    const owner = (await userRepo.save(
      userRepo.create({
        email: `owner-inbox-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'Test',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      } as any),
    )) as any;

    const business = (await businessRepo.save(
      businessRepo.create({
        name: 'Inbox Test Biz',
        ownerId: owner.id,
      } as any),
    )) as any;
    owner.businessId = business.id;
    await userRepo.save(owner);

    // 2. Create Branch
    const branch = (await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: business.id,
        isActive: true,
      } as any),
    )) as any;
    branchId = branch.id;

    // 3. Create Visitor (Visited)
    const visitorUser = (await userRepo.save(
      userRepo.create({
        email: `visitor-inbox-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Visitor',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      } as any),
    )) as any;
    customerId = visitorUser.id;

    await visitRepo.save(visitRepo.create({
        customerId,
        branchId,
        businessId: business.id,
        status: 'new'
    }));

    // 4. Create another Visitor (Not Visited)
    const otherVisitorUser = (await userRepo.save(
        userRepo.create({
          email: `other-visitor-${testId}@test.com`,
          password: hashedPassword,
          firstName: 'OtherVisitor',
          lastName: 'Test',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        } as any),
      )) as any;
    otherCustomerId = otherVisitorUser.id;

    // Login
    const ownerLogin = await authService.login({
      identifier: owner.email,
      password,
    });
    ownerToken = ownerLogin.access_token;

    const visitorLogin = await authService.login({
      identifier: visitorUser.email,
      password,
    });
    visitorToken = visitorLogin.access_token;

    const otherVisitorLogin = await authService.login({
        identifier: otherVisitorUser.email,
        password,
      });
    otherVisitorToken = otherVisitorLogin.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow visitor who visited to start a conversation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customer/messaging/threads/start')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        branchId,
        content: 'First message from customer',
      });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('First message from customer');
    expect(res.body.threadId).toBeDefined();

    const thread = await threadRepo.findOne({ where: { id: res.body.threadId } });
    expect(thread?.branchUnreadCount).toBe(1);
  });

  it('should fail if customer has not visited the branch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customer/messaging/threads/start')
      .set('Authorization', `Bearer ${otherVisitorToken}`)
      .send({
        branchId,
        content: 'I want to chat',
      });

    expect(res.status).toBe(403);
  });

  it('should allow branch to reply to the thread started by customer', async () => {
    const thread = await threadRepo.findOne({ where: { customerId, branchId } });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/messaging/inbox/threads/${thread?.id}/reply?branchId=${branchId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        content: 'Hello from Branch!',
      });

    expect(res.status).toBe(201);
    
    const updatedThread = await threadRepo.findOne({ where: { id: thread?.id } });
    expect(updatedThread?.customerUnreadCount).toBe(1);
    expect(updatedThread?.lastMessageContent).toBe('Hello from Branch!');
  });
});
