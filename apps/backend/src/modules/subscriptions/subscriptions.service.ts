import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription, SubscriptionStatus, BillingPeriod } from './entities/subscription.entity';
import { Repository } from 'typeorm';
import { PlansService } from './plans.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Business } from '../businesses/entities/business.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        private readonly plansService: PlansService,
        private readonly httpService: HttpService,
    ) { }

    async activeSubscription(businessId: string): Promise<Subscription | null> {
        const sub = await this.subscriptionRepository.findOne({
            where: {
                businessId,
                status: SubscriptionStatus.ACTIVE,
            },
            relations: ['plan'],
            order: {
                createdAt: 'DESC',
            },
        });

        if (sub && sub.endDate < new Date()) {
            sub.status = SubscriptionStatus.EXPIRED;
            await this.subscriptionRepository.save(sub);
            return null;
        }

        return sub;
    }

    async verifyPaystackPayment(reference: string): Promise<boolean> {
        try {
            const secretKey = process.env.PAYSTACK_SECRET_KEY;
            if (!secretKey) {
                throw new Error('PAYSTACK_SECRET_KEY not configured');
            }

            const response = await firstValueFrom(
                this.httpService.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                    headers: {
                        Authorization: `Bearer ${secretKey}`,
                    },
                }),
            );

            const data = response.data;
            if (data.status && data.data.status === 'success') {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Paystack Verification Error:', error.message);
            return false;
        }
    }

    async subscribe(subscribeDto: SubscribeDto): Promise<Subscription> {
        const { planId, businessId, billingPeriod, paymentReference } = subscribeDto;

        const plan = await this.plansService.findOne(planId);
        if (!plan.isActive) {
            throw new BadRequestException('Selected plan is not active');
        }

        const business = await this.businessRepository.findOne({ where: { id: businessId } });
        if (!business) {
            throw new NotFoundException('Business not found');
        }

        // Verify payment if not free
        if (!plan.isFree) {
            if (!paymentReference) {
                throw new BadRequestException('Payment reference is required for paid plans');
            }
            const isPaymentValid = await this.verifyPaystackPayment(paymentReference);
            if (!isPaymentValid) {
                throw new BadRequestException('Payment verification failed');
            }
        }

        // Deactivate previous subscriptions
        const activeSub = await this.activeSubscription(businessId);
        if (activeSub) {
            activeSub.status = SubscriptionStatus.CANCELED;
            await this.subscriptionRepository.save(activeSub);
        }

        const startDate = new Date();
        const endDate = new Date(startDate);

        if (plan.isFree && plan.freeDurationDays) {
            endDate.setDate(endDate.getDate() + plan.freeDurationDays);
        } else if (plan.isFree && !plan.freeDurationDays) {
            // Free forever (give it 10 years or handle differently)
            endDate.setFullYear(endDate.getFullYear() + 10);
        } else {
            if (billingPeriod === BillingPeriod.MONTHLY) endDate.setMonth(endDate.getMonth() + 1);
            if (billingPeriod === BillingPeriod.QUARTERLY) endDate.setMonth(endDate.getMonth() + 3);
            if (billingPeriod === BillingPeriod.YEARLY) endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const newSub = this.subscriptionRepository.create({
            businessId,
            planId,
            billingPeriod,
            startDate,
            endDate,
            status: SubscriptionStatus.ACTIVE,
            paystackReference: paymentReference,
        });

        return this.subscriptionRepository.save(newSub);
    }

    async getCapabilities(businessId: string) {
        const sub = await this.activeSubscription(businessId);

        // Default fallback if no plan
        let plan = sub?.plan;
        if (!plan) {
            // Try to get a default free plan
            const plans = await this.plansService.findAll(true);
            plan = plans.find(p => p.isFree);
        }

        if (!plan) {
            throw new BadRequestException('No active plan and no default free plan available');
        }

        // Load business with relations to count usage
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['staff', 'devices'],
        });

        const usedStaff = business?.staff?.length || 0;
        const usedTags = business?.devices?.length || 0;

        // We can expand loyalty usage metrics as needed. For now just mock it or calculate it properly if entities exist.
        // e.g. usedLoyaltyPrograms
        const usedLoyaltyPrograms = 0;

        return {
            plan: plan.name,
            isActive: sub?.status === SubscriptionStatus.ACTIVE,
            capabilities: {
                teamMembers: {
                    limit: plan.teamMembersLimit ?? 'unlimited',
                    used: usedStaff,
                    remaining: plan.teamMembersLimit === null ? 'unlimited' : Math.max(0, plan.teamMembersLimit - usedStaff)
                },
                tags: {
                    limit: plan.tagsLimit ?? 'unlimited',
                    used: usedTags,
                    remaining: plan.tagsLimit === null ? 'unlimited' : Math.max(0, plan.tagsLimit - usedTags)
                },
                loyaltyPrograms: {
                    limit: plan.loyaltyLimit ?? 'unlimited',
                    used: usedLoyaltyPrograms,
                    remaining: plan.loyaltyLimit === null ? 'unlimited' : Math.max(0, plan.loyaltyLimit - usedLoyaltyPrograms)
                },
                analytics: plan.analyticsLevel
            }
        };
    }

    // --- Admin Methods ---

    async findAllAdmin() {
        const subs = await this.subscriptionRepository.find({
            relations: ['plan', 'business'],
            order: { createdAt: 'DESC' }
        });

        return subs.map(sub => ({
            id: sub.id,
            business: sub.business?.name || 'Unknown Business',
            owner: sub.business?.ownerId ? 'Linked' : 'Unknown', // Add robust owner fetch if needed
            plan: sub.plan?.name || 'Unknown Plan',
            status: sub.status,
            renewal: sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : 'N/A',
            amount: sub.plan?.monthlyPrice ? `₦${sub.plan.monthlyPrice.toLocaleString()}` : (sub.plan?.isFree ? 'Free' : 'N/A')
        }));
    }

    async getAdminStats() {
        // Calculate dynamic real-time stats
        const allSubs = await this.subscriptionRepository.find({
            where: { status: SubscriptionStatus.ACTIVE },
            relations: ['plan']
        });

        let active = 0;
        let expiringSoon = 0;
        let pastDue = await this.subscriptionRepository.count({ where: { status: SubscriptionStatus.EXPIRED } });

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        allSubs.forEach(sub => {
            if (sub.endDate > now && sub.endDate <= nextWeek) {
                expiringSoon++;
                active++; // It's still active
            } else if (sub.endDate > now) {
                active++;
            }
        });

        return {
            activeSubscriptions: active,
            expiringSoon,
            pastDue
        };
    }
}
