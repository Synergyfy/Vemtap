import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Visit)
        private readonly visitRepository: Repository<Visit>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async getDashboardAnalytics(branchId: string) {
        const where = { branchId };

        const totalVisitsCount = await this.visitRepository.count({ where });

        const totalCustomersCount = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.visits', 'visit', 'visit.branchId = :branchId', { branchId })
            .where('user.role = :role', { role: UserRole.CUSTOMER })
            .groupBy('user.id')
            .getCount();

        return {
            stats: [
                { label: 'Total Visits', value: totalVisitsCount.toLocaleString(), trend: '+0%', isUp: true },
                { label: 'Total Customers', value: totalCustomersCount.toLocaleString(), trend: '+0%', isUp: true },
                { label: 'Avg. Stay Time', value: '42m', trend: '0%', isUp: true },
                { label: 'Repeat Rate', value: '0%', trend: '0%', isUp: true },
            ],
            peakTimes: [
                { hour: '9am', value: 30 },
                { hour: '11am', value: 45 },
                { hour: '1pm', value: 85 },
                { hour: '3pm', value: 60 },
                { hour: '5pm', value: 95 },
                { hour: '7pm', value: 75 },
                { hour: '9pm', value: 40 },
            ],
            messagingRoi: [
                { label: 'Sent', value: '12,450' },
                { label: 'Delivered', value: '12,200', sub: '98%' },
                { label: 'Opened', value: '8,450', sub: '69%' },
                { label: 'Clicked', value: '3,120', sub: '25%' },
                { label: 'Failed', value: '250', sub: '2%' },
                { label: 'Unsub', value: '45', sub: '0.3%' },
            ],
            engagementQuality: {
                surveyCompletion: '78%',
                reviewConversion: '12.4%',
                socialFollows: '42/day',
            },
            topPerformers: [
                { label: 'Review Collection', type: 'collection' },
                { label: 'Customer Survey #1', type: 'survey' },
                { label: 'NFC Tap Points', type: 'nfc' }
            ]
        };
    }

    async getFootfallAnalytics(branchId: string) {
        const where = { branchId };

        const totalFootfall = await this.visitRepository.count({ where });

        return {
            stats: [
                { label: 'Total Footfall', value: totalFootfall.toLocaleString() },
                { label: 'Busiest Day', value: 'Saturday' },
                { label: 'Peak Hour', value: '7:00 PM' },
                { label: 'Devices Active', value: '1/1' },
            ],
            hourlyData: [
                { hour: '8am', count: 12 }, { hour: '9am', count: 25 }, { hour: '10am', count: 45 }, { hour: '11am', count: 38 },
                { hour: '12pm', count: 72 }, { hour: '1pm', count: 85 }, { hour: '2pm', count: 68 }, { hour: '3pm', count: 54 },
                { hour: '4pm', count: 62 }, { hour: '5pm', count: 88 }, { hour: '6pm', count: 124 }, { hour: '7pm', count: 156 },
                { hour: '8pm', count: 142 }, { hour: '9pm', count: 98 }, { hour: '10pm', count: 65 }, { hour: '11pm', count: 32 },
            ],
            trafficByEntrance: [
                { name: 'Main Gate', percentage: '45%', count: '2,842' },
                { name: 'Side Entrance', percentage: '28%', count: '1,540' },
                { name: 'Parking Lot', percentage: '20%', count: '1,241' },
                { name: 'Loading Dock', percentage: '7%', count: '312' },
            ],
            visitDuration: {
                averageStay: '45 Minutes',
                trendText: '+12%',
                distribution: [
                    { label: 'Short', time: '< 15m', p: '24%' },
                    { label: 'Medium', time: '15-60m', p: '58%' },
                    { label: 'Long', time: '> 60m', p: '18%' },
                ]
            }
        };
    }

    async getPeakTimesAnalytics(branchId: string) {
        return {
            weeklyData: [
                { day: 'Monday', hours: [10, 15, 20, 25, 40, 50, 45, 30, 25, 20] },
                { day: 'Tuesday', hours: [12, 18, 25, 30, 45, 55, 50, 35, 30, 25] },
                { day: 'Wednesday', hours: [15, 22, 28, 35, 50, 60, 55, 40, 35, 30] },
                { day: 'Thursday', hours: [20, 30, 40, 50, 70, 85, 80, 60, 50, 40] },
                { day: 'Friday', hours: [30, 45, 60, 80, 100, 120, 110, 90, 80, 70] },
                { day: 'Saturday', hours: [40, 60, 80, 110, 140, 160, 150, 130, 110, 90] },
                { day: 'Sunday', hours: [35, 55, 75, 100, 130, 150, 140, 120, 100, 80] },
            ],
            hoursLabels: ['10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am', '2am', '4am'],
            smartSuggestion: {
                peakTime: 'Saturdays between 6pm - 8pm',
                recommendation: 'Based on your peak times (Saturdays between 6pm - 8pm), we suggest adding **2 additional staff** members during this window to reduce wait times and improve customer satisfaction.',
            }
        };
    }

    // --- Admin Methods ---

    getAdminLoyaltyStats() {
        return {
            stats: [
                { label: 'Total Issuers', value: '452', change: 15.2, trend: 'up' },
                { label: 'Active Members', value: '124,802', change: 24.5, trend: 'up' },
                { label: 'Points in Circulation', value: '8.4M', change: 8.2, trend: 'up' },
                { label: 'Fraud Alerts', value: '12', change: -45.0, trend: 'down' },
            ],
            securityAlerts: [
                { msg: 'Abnormal check-in velocity detected at BISTRO_001', type: 'risk' },
                { msg: 'Point inflation threshold exceeded in sector: RETAIL', type: 'warn' },
                { msg: '3 duplicate redemption codes invalidated by Core', type: 'info' },
            ],
            sectorSplit: [
                { label: 'Hospitality', value: 42 },
                { label: 'Retail', value: 35 },
                { label: 'Entertainment', value: 15 },
                { label: 'Corporate', value: 8 },
            ]
        };
    }
}
