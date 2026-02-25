import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyProfile, TierLevel } from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { DevicesService } from '../devices/devices.service';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LoyaltyService', () => {
    let service: LoyaltyService;
    let devicesService: DevicesService;
    let dataSource: DataSource;

    const mockLoyaltyProfileRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    const mockRewardRepository = {
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockTransactionRepository = {
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        })),
    };

    const mockRedemptionRepository = {
        find: jest.fn(),
    };

    const mockRepository = {
        findOneBy: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
    };

    const mockDevicesService = {
        findByCode: jest.fn(),
        adminUpdate: jest.fn(),
    };

    const mockDataSource = {
        getRepository: jest.fn((entity) => mockRepository),
        transaction: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoyaltyService,
                {
                    provide: getRepositoryToken(LoyaltyProfile),
                    useValue: mockLoyaltyProfileRepository,
                },
                {
                    provide: getRepositoryToken(Reward),
                    useValue: mockRewardRepository,
                },
                {
                    provide: getRepositoryToken(PointTransaction),
                    useValue: mockTransactionRepository,
                },
                {
                    provide: getRepositoryToken(Redemption),
                    useValue: mockRedemptionRepository,
                },
                {
                    provide: DevicesService,
                    useValue: mockDevicesService,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<LoyaltyService>(LoyaltyService);
        devicesService = module.get<DevicesService>(DevicesService);
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDeviceByCode', () => {
        it('should return device info if active', async () => {
            const mockDevice = {
                id: 'dev-1',
                code: 'ABC',
                status: 'active',
                business: { id: 'biz-1' },
                branch: { id: 'br-1' },
            };
            mockDevicesService.findByCode.mockResolvedValue(mockDevice);

            const result = await service.getDeviceByCode('ABC');
            expect(result).toEqual({
                id: 'dev-1',
                name: undefined,
                code: 'ABC',
                type: undefined,
                business: { id: 'biz-1' },
                branch: { id: 'br-1' },
            });
        });

        it('should throw NotFoundException if device not found', async () => {
            mockDevicesService.findByCode.mockResolvedValue(null);
            await expect(service.getDeviceByCode('ABC')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if device is inactive', async () => {
            mockDevicesService.findByCode.mockResolvedValue({ status: 'inactive' });
            await expect(service.getDeviceByCode('ABC')).rejects.toThrow(BadRequestException);
        });
    });

    describe('processTap', () => {
        const userId = 'user-1';
        const deviceCode = 'ABC';
        const mockDevice = {
            id: 'dev-1',
            code: 'ABC',
            status: 'active',
            businessId: 'biz-1',
            branchId: 'br-1',
            totalScans: 5,
        };
        const mockUser = { id: userId, email: 'test@example.com', phone: '123' };

        it('should process tap and record visit', async () => {
            mockDevicesService.findByCode.mockResolvedValue(mockDevice);
            mockRepository.findOneBy.mockResolvedValue(mockUser);
            mockRepository.findOne.mockResolvedValue(null); // No existing contact

            // Mock earnPoints (which uses transaction)
            mockDataSource.transaction.mockImplementation(async (cb) => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({ currentPointsBalance: 0, totalPointsEarned: 0 }),
                    save: jest.fn().mockImplementation(val => val),
                    create: jest.fn().mockImplementation((entity, data) => data),
                };
                return cb(manager);
            });

            mockRepository.create.mockImplementation((data) => data);
            mockRepository.save.mockImplementation((data) => Promise.resolve(data));

            const result = await service.processTap(userId, deviceCode);

            expect(devicesService.findByCode).toHaveBeenCalledWith(deviceCode);
            expect(devicesService.adminUpdate).toHaveBeenCalledWith(mockDevice.id, { totalScans: 6 });
            expect(mockRepository.create).toHaveBeenCalled(); // Should be called for Visit and Contact
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
});
