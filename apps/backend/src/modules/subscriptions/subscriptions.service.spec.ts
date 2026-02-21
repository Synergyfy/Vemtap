import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription, SubscriptionStatus, BillingPeriod } from './entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { PlansService } from './plans.service';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    let subRepository: Repository<Subscription>;
    let busRepository: Repository<Business>;
    let plansService: PlansService;
    let httpService: HttpService;

    const mockPlan = {
        id: '1',
        name: 'Test Plan',
        isActive: true,
        isFree: false,
        teamMembersLimit: 5,
        tagsLimit: 10,
        loyaltyLimit: 2,
        analyticsLevel: 'basic',
    };

    const mockFreePlan = {
        ...mockPlan,
        id: '2',
        name: 'Free Plan',
        isFree: true,
        freeDurationDays: 30,
        teamMembersLimit: 1,
        tagsLimit: 1,
        loyaltyLimit: 1,
    };

    const mockBusiness = {
        id: 'b1',
        name: 'Test Business',
        staff: [{ id: 's1' }],
        devices: [{ id: 'd1' }, { id: 'd2' }],
    };

    const mockSubscription = {
        id: 'sub1',
        businessId: 'b1',
        planId: '1',
        plan: mockPlan,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date(new Date().getTime() + 10000000), // future
    };

    const mockSubRepository = {
        findOne: jest.fn().mockResolvedValue(mockSubscription),
        save: jest.fn().mockImplementation((sub) => Promise.resolve({ id: 'newSub', ...sub })),
        create: jest.fn().mockImplementation((dto) => dto),
    };

    const mockBusRepository = {
        findOne: jest.fn().mockResolvedValue(mockBusiness),
    };

    const mockPlansService = {
        findOne: jest.fn().mockResolvedValue(mockPlan),
        findAll: jest.fn().mockResolvedValue([mockFreePlan, mockPlan]),
    };

    const mockHttpService = {
        get: jest.fn().mockReturnValue(of({ data: { status: true, data: { status: 'success' } } })),
    };

    beforeEach(async () => {
        process.env.PAYSTACK_SECRET_KEY = 'test-key';
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                { provide: getRepositoryToken(Subscription), useValue: mockSubRepository },
                { provide: getRepositoryToken(Business), useValue: mockBusRepository },
                { provide: PlansService, useValue: mockPlansService },
                { provide: HttpService, useValue: mockHttpService },
            ],
        }).compile();

        service = module.get<SubscriptionsService>(SubscriptionsService);
        subRepository = module.get(getRepositoryToken(Subscription));
        busRepository = module.get(getRepositoryToken(Business));
        plansService = module.get(PlansService);
        httpService = module.get(HttpService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('activeSubscription', () => {
        it('should return active subscription', async () => {
            const sub = await service.activeSubscription('b1');
            expect(sub).toEqual(mockSubscription);
            expect(mockSubRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { businessId: 'b1', status: SubscriptionStatus.ACTIVE },
            }));
        });

        it('should update status to expired if end date is in the past', async () => {
            const expiredSub = { ...mockSubscription, endDate: new Date(new Date().getTime() - 100000) };
            mockSubRepository.findOne.mockResolvedValueOnce(expiredSub);

            const sub = await service.activeSubscription('b1');
            expect(sub).toBeNull();
            expect(mockSubRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: SubscriptionStatus.EXPIRED }));
        });
    });

    describe('verifyPaystackPayment', () => {
        it('should return true for valid payment', async () => {
            const isValid = await service.verifyPaystackPayment('ref123');
            expect(isValid).toBe(true);
            expect(mockHttpService.get).toHaveBeenCalledWith(
                'https://api.paystack.co/transaction/verify/ref123',
                expect.any(Object),
            );
        });

        it('should return false for invalid payment', async () => {
            mockHttpService.get.mockReturnValueOnce(of({ data: { status: false } }));
            const isValid = await service.verifyPaystackPayment('badRef');
            expect(isValid).toBe(false);
        });
    });

    describe('subscribe', () => {
        it('should throw if plan is not active', async () => {
            mockPlansService.findOne.mockResolvedValueOnce({ ...mockPlan, isActive: false });
            await expect(service.subscribe({ planId: '1', businessId: 'b1', billingPeriod: BillingPeriod.MONTHLY }))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw if business not found', async () => {
            mockBusRepository.findOne.mockResolvedValueOnce(null);
            await expect(service.subscribe({ planId: '1', businessId: 'b1', billingPeriod: BillingPeriod.MONTHLY }))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw if payment ref is missing for paid plan', async () => {
            await expect(service.subscribe({ planId: '1', businessId: 'b1', billingPeriod: BillingPeriod.MONTHLY }))
                .rejects.toThrow(BadRequestException);
        });

        it('should verify payment and create subscription for paid plan', async () => {
            mockSubRepository.findOne.mockResolvedValueOnce(null); // No previous sub
            const verifySpy = jest.spyOn(service, 'verifyPaystackPayment').mockResolvedValue(true);

            const res = await service.subscribe({
                planId: '1',
                businessId: 'b1',
                billingPeriod: BillingPeriod.MONTHLY,
                paymentReference: 'validRef'
            });

            expect(verifySpy).toHaveBeenCalledWith('validRef');
            expect(mockSubRepository.create).toHaveBeenCalled();
            expect(res.businessId).toEqual('b1');
            expect(res.planId).toEqual('1');
        });

        it('should safely subscribe to free plan without payment ref', async () => {
            mockPlansService.findOne.mockResolvedValueOnce(mockFreePlan);
            mockSubRepository.findOne.mockResolvedValueOnce(null);

            const res = await service.subscribe({
                planId: '2',
                businessId: 'b1',
                billingPeriod: BillingPeriod.MONTHLY,
            });

            expect(mockSubRepository.create).toHaveBeenCalled();
            expect(res.planId).toEqual('2');
        });

        it('should cancel active plan upon new subscription', async () => {
            mockSubRepository.findOne.mockResolvedValueOnce(mockSubscription); // has existing sub
            jest.spyOn(service, 'verifyPaystackPayment').mockResolvedValue(true);

            await service.subscribe({
                planId: '1',
                businessId: 'b1',
                billingPeriod: BillingPeriod.MONTHLY,
                paymentReference: 'validRef'
            });

            expect(mockSubRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: 'sub1', status: SubscriptionStatus.CANCELED
            }));
        });
    });

    describe('getCapabilities', () => {
        it('should calculate capabilities correctly based on active plan', async () => {
            mockSubRepository.findOne.mockResolvedValueOnce({ ...mockSubscription, status: SubscriptionStatus.ACTIVE });
            const caps = await service.getCapabilities('b1');

            expect(caps.isActive).toBe(true);
            expect(caps.plan).toEqual('Test Plan');
            expect(caps.capabilities).toEqual({
                teamMembers: { limit: 5, used: 1, remaining: 4 },
                tags: { limit: 10, used: 2, remaining: 8 },
                loyaltyPrograms: { limit: 2, used: 0, remaining: 2 },
                analytics: 'basic',
            });
        });

        it('should fallback to free plan if no active subscription', async () => {
            mockSubRepository.findOne.mockResolvedValueOnce(null); // No active sub
            const caps = await service.getCapabilities('b1');

            expect(caps.isActive).toBe(false);
            expect(caps.plan).toEqual('Free Plan');
            expect(caps.capabilities.teamMembers.remaining).toBe(0); // 1 limit - 1 used
        });
    });
});
