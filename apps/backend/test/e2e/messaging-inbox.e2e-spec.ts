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
  let authService: AuthService;

  let ownerToken: string;
  let visitorToken: string;
  let branchId: string;
  let customerId: string;

  beforeAll(async () => {
    app = await createTestApp();

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    branchRepo = app.get(getRepositoryToken(Branch));
    threadRepo = app.get(getRepositoryToken(ConversationThread));
    messageRepo = app.get(getRepositoryToken(Message));
    authService = app.get(AuthService);

    const testId = Date.now().toString();
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Owner & Business
    const owner = await userRepo.save(
      userRepo.create({
        email: `owner-inbox-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'Test',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      } as any),
    );

    const business = await businessRepo.save(
      businessRepo.create({
        name: 'Inbox Test Biz',
        ownerId: owner.id,
      } as any),
    );
    owner.businessId = business.id;
    await userRepo.save(owner);

    // 2. Create Branch
    const branch = await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: business.id,
        isActive: true,
      } as any),
    );
    branchId = branch.id;

    // 3. Create Visitor (as a User with CUSTOMER role)
    const visitorUser = await userRepo.save(
      userRepo.create({
        email: `visitor-inbox-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Visitor',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      } as any),
    );
    customerId = visitorUser.id;

    // Login both
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow branch to start a conversation (creates a thread)', async () => {
    const thread = await threadRepo.save(threadRepo.create({
      branchId,
      businessId: (await branchRepo.findOneBy({id: branchId}))?.businessId,
      customerId,
      channel: Channel.IN_HOUSE,
      status: ThreadStatus.OPEN,
    } as any));

    const res = await request(app.getHttpServer())
      .post(`/api/v1/messaging/inbox/threads/${thread.id}/reply?branchId=${branchId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        content: 'Hello from Branch!',
      });

    expect(res.status).toBe(201);
    
    const updatedThread = await threadRepo.findOne({ where: { id: thread.id } });
    expect(updatedThread?.customerUnreadCount).toBe(1);
    expect(updatedThread?.lastMessageContent).toBe('Hello from Branch!');
  });

  it('should allow visitor to see their inbox sorted by newest', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/customer/messaging/threads')
      .set('Authorization', `Bearer ${visitorToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].lastMessageContent).toBe('Hello from Branch!');
  });

  it('should allow visitor to reply and increment branch unread count', async () => {
    const thread = await threadRepo.findOne({ where: { customerId, branchId } });
    
    const res = await request(app.getHttpServer())
      .post(`/api/v1/customer/messaging/threads/${thread?.id}/reply`)
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        content: 'Hello back from Visitor!',
      })
      .expect(201);

    const updatedThread = await threadRepo.findOne({ where: { id: thread?.id } });
    expect(updatedThread?.branchUnreadCount).toBe(1);
    expect(updatedThread?.lastMessageContent).toBe('Hello back from Visitor!');
  });

  it('should support quoting (replyToId)', async () => {
    const thread = await threadRepo.findOne({ where: { customerId, branchId } });
    const messages = await messageRepo.find({ where: { threadId: thread?.id }, order: { timestamp: 'DESC' } });
    const originalMsgId = messages[0].id;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/messaging/inbox/threads/${thread?.id}/reply?branchId=${branchId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        content: 'Quoting you now!',
        replyToId: originalMsgId,
      })
      .expect(201);

    expect(res.body.replyToId).toBe(originalMsgId);
    
    // Fetch messages to verify sort and content
    const msgRes = await request(app.getHttpServer())
      .get(`/api/v1/messaging/inbox/threads/${thread?.id}?branchId=${branchId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(msgRes.body[0].content).toBe('Quoting you now!');
    expect(msgRes.body[0].replyTo.id).toBe(originalMsgId);
  });
});
