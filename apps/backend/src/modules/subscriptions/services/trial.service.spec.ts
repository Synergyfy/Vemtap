import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { TrialService } from './trial.service';
import {
  BillingPeriod,
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Business } from '../../businesses/entities/business.entity';
import { SubscriptionsService } from '../subscriptions.service';
import { PlansService } from '../plans.service';
import { PaymentsService } from '../../payments/payments.service';
import { MailService } from '../../mail/mail.service';
import { PaymentPurpose } from '../../payments/entities/payment.entity';

const DAY = 24 * 60 * 60 * 1000;

describe('TrialService', () => {
  let service: TrialService;
  let subRepo: any;
  let subscriptions: any;
  let plans: any;
  let payments: any;
  let mail: any;
  let notifications: any;
  let push: any;

  const owner = { id: 'owner-1', email: 'owner@biz.ng', firstName: 'Ada' };
  const business = { id: 'b1', name: 'Mama Put', officialEmail: null, owner };

  beforeEach(async () => {
    subRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    subscriptions = {
      trialUsage: jest.fn().mockResolvedValue({ used: false, usedAt: null }),
      subscribe: jest.fn().mockResolvedValue({ subscription: { id: 'sub-1' } }),
      onTrialExpired: jest.fn(),
      activeSubscription: jest.fn(),
    };
    plans = { findOne: jest.fn() };
    payments = { listForBusiness: jest.fn() };
    mail = { sendTrialEndingReminder: jest.fn().mockResolvedValue(true) };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    push = { sendNotification: jest.fn().mockResolvedValue({ queued: true }) };
    const moduleRef = {
      get: jest.fn((token: { name: string }) =>
        token.name === 'NotificationsService' ? notifications : push,
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        TrialService,
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        {
          provide: getRepositoryToken(Business),
          useValue: { findOne: jest.fn() },
        },
        { provide: SubscriptionsService, useValue: subscriptions },
        { provide: PlansService, useValue: plans },
        { provide: PaymentsService, useValue: payments },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://app.vemtap.com/' },
        },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    service = module.get(TrialService);
  });

  it('notifies the owner when a trial ends', async () => {
    service.onModuleInit();
    const [listener] = subscriptions.onTrialExpired.mock.calls[0];
    await listener({
      businessId: 'b1',
      business,
      plan: { name: 'Professional' },
    });

    expect(mail.sendTrialEndingReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@biz.ng',
        daysLeft: 0,
        subscribeUrl: 'https://app.vemtap.com/dashboard/settings/subscription',
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      'owner-1',
      'Your free trial has ended',
      expect.stringContaining('Nothing was charged'),
      'warning',
      '/business/subscribe',
      expect.objectContaining({ type: 'trial_ended' }),
    );
    expect(push.sendNotification).toHaveBeenCalledWith(
      'owner-1',
      'Your free trial has ended',
      expect.any(String),
      expect.objectContaining({ category: 'billing' }),
    );
  });

  describe('startTrial', () => {
    it('starts a trial of a paid plan with a trial period', async () => {
      plans.findOne.mockResolvedValue({
        id: 'p2',
        isFree: false,
        trialDurationDays: 30,
      });
      await service.startTrial('b1', 'p2');
      expect(subscriptions.subscribe).toHaveBeenCalledWith({
        planId: 'p2',
        businessId: 'b1',
        billingPeriod: BillingPeriod.MONTHLY,
        isTrial: true,
      });
    });

    it('refuses free plans, plans without a trial and a second trial', async () => {
      plans.findOne.mockResolvedValueOnce({ isFree: true });
      await expect(service.startTrial('b1', 'p1')).rejects.toThrow(
        /always free/,
      );

      plans.findOne.mockResolvedValueOnce({
        isFree: false,
        trialDurationDays: 0,
      });
      await expect(service.startTrial('b1', 'p2')).rejects.toThrow(
        BadRequestException,
      );

      plans.findOne.mockResolvedValueOnce({
        isFree: false,
        trialDurationDays: 30,
      });
      subscriptions.trialUsage.mockResolvedValueOnce({
        used: true,
        usedAt: new Date(),
      });
      await expect(service.startTrial('b1', 'p2')).rejects.toThrow(
        /already used/,
      );
      expect(subscriptions.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('sendTrialReminders', () => {
    const now = new Date('2026-10-14T09:00:00Z');
    const trial = (
      daysLeft: number,
      trialReminderStage: number | null = null,
    ) => ({
      id: `t-${daysLeft}`,
      businessId: 'b1',
      status: SubscriptionStatus.TRIAL,
      endDate: new Date(now.getTime() + daysLeft * DAY),
      trialReminderStage,
      business,
      plan: { name: 'Professional' },
    });

    it('sends the 3-day and 1-day reminders once each', async () => {
      subRepo.find.mockResolvedValue([
        trial(3),
        trial(2.5, 3), // 3-day sent, 1-day not due yet
        trial(0.6, 3), // 1-day now due
        trial(0.4, 1), // 1-day already sent
      ]);

      const sent = await service.sendTrialReminders(now);

      expect(sent).toBe(2);
      expect(subRepo.update).toHaveBeenCalledWith('t-3', {
        trialReminderStage: 3,
      });
      expect(subRepo.update).toHaveBeenCalledWith('t-0.6', {
        trialReminderStage: 1,
      });
      expect(mail.sendTrialEndingReminder).toHaveBeenCalledWith(
        expect.objectContaining({ daysLeft: 3 }),
      );
      expect(mail.sendTrialEndingReminder).toHaveBeenCalledWith(
        expect.objectContaining({ daysLeft: 1 }),
      );
    });
  });

  it('counts days remaining upwards so "ends tonight" is 1', () => {
    const now = new Date('2026-10-14T09:00:00Z');
    expect(
      TrialService.daysRemaining(
        new Date(now.getTime() + 2 * 60 * 60 * 1000),
        now,
      ),
    ).toBe(1);
    expect(
      TrialService.daysRemaining(new Date(now.getTime() + 3 * DAY), now),
    ).toBe(3);
    expect(TrialService.daysRemaining(new Date(now.getTime() - DAY), now)).toBe(
      0,
    );
    expect(TrialService.daysRemaining(null, now)).toBeNull();
  });

  it('lists only subscription and add-on payments of the business', async () => {
    payments.listForBusiness.mockResolvedValue({
      data: [
        {
          id: 'pay-1',
          reference: 'REF',
          amount: '16125.00',
          currency: 'NGN',
          status: 'Success',
          purpose: PaymentPurpose.SUBSCRIPTION,
          metadata: {
            planId: 'p2',
            billingPeriod: 'monthly',
            subtotal: 15000,
            taxAmount: 1125,
          },
          createdAt: new Date('2026-10-01T10:00:00Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    const history = await service.billingHistory('b1');

    expect(payments.listForBusiness).toHaveBeenCalledWith('b1', {
      purposes: [
        PaymentPurpose.SUBSCRIPTION,
        PaymentPurpose.PLAN_WITH_ADDONS,
        PaymentPurpose.ADDON,
      ],
      page: 1,
      limit: 20,
    });
    expect(history.data[0]).toMatchObject({
      amount: 16125,
      subtotal: 15000,
      taxAmount: 1125,
      planId: 'p2',
    });
    expect(history.hasNextPage).toBe(false);
  });

  it('reports the card on file and whether renewals charge it', async () => {
    subscriptions.activeSubscription.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      paystackAuthorizationCode: 'AUTH',
      plan: { isFree: false },
      cardSummary: {
        brand: 'visa',
        last4: '4081',
        expMonth: '12',
        expYear: '2030',
        bank: 'Test Bank',
      },
    });
    await expect(service.paymentMethod('b1')).resolves.toEqual({
      hasCard: true,
      card: {
        brand: 'visa',
        last4: '4081',
        expMonth: '12',
        expYear: '2030',
        bank: 'Test Bank',
      },
      autoRenews: true,
    });

    subscriptions.activeSubscription.mockResolvedValue({
      status: SubscriptionStatus.TRIAL,
      paystackAuthorizationCode: null,
      plan: { isFree: false },
      cardSummary: null,
    });
    subRepo.findOne.mockResolvedValue(null);
    await expect(service.paymentMethod('b1')).resolves.toEqual({
      hasCard: false,
      card: null,
      autoRenews: false,
    });
  });
});
