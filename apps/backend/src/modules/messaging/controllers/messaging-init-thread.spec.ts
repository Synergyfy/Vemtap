import { NotFoundException } from '@nestjs/common';
import { MessagingController } from './messaging.controller';

/**
 * `POST /messaging/inbox/threads/init` used to open a thread with any user id.
 * A new thread now needs someone who is already this business's customer;
 * an existing thread can always be reopened.
 */
describe('MessagingController.initThread', () => {
  const owner = { user: { id: 'owner-1', businessId: 'biz-1' } } as never;
  const thread = { id: 'thread-1', branchId: 'branch-1', customerId: 'cust-1' };

  function setup(opts: { existing?: unknown; known?: boolean }) {
    const inbox = {
      findBranchConversation: jest
        .fn()
        .mockResolvedValue(opts.existing ?? null),
      initBranchConversation: jest.fn().mockResolvedValue(thread),
    };
    const customers = {
      isKnownCustomer: jest.fn().mockResolvedValue(opts.known ?? false),
    };
    const helper = { resolveBranchId: jest.fn().mockResolvedValue('branch-1') };
    const controller = new MessagingController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      inbox as never,
      {} as never,
      helper as never,
      customers as never,
    );
    return { controller, inbox, customers };
  }

  it('reopens an existing thread without the customer check', async () => {
    const { controller, inbox, customers } = setup({ existing: thread });
    await expect(
      controller.initThread({ customerId: 'cust-1' }, owner),
    ).resolves.toBe(thread);
    expect(customers.isKnownCustomer).not.toHaveBeenCalled();
    expect(inbox.initBranchConversation).not.toHaveBeenCalled();
  });

  it('opens a new thread with a known customer', async () => {
    const { controller, inbox, customers } = setup({ known: true });
    await expect(
      controller.initThread({ customerId: 'cust-1' }, owner),
    ).resolves.toBe(thread);
    expect(customers.isKnownCustomer).toHaveBeenCalledWith('biz-1', 'cust-1');
    expect(inbox.initBranchConversation).toHaveBeenCalledWith(
      'branch-1',
      'cust-1',
    );
  });

  it('refuses a user who has never dealt with the business', async () => {
    const { controller, inbox } = setup({ known: false });
    await expect(
      controller.initThread({ customerId: 'stranger' }, owner),
    ).rejects.toThrow(NotFoundException);
    expect(inbox.initBranchConversation).not.toHaveBeenCalled();
  });
});
