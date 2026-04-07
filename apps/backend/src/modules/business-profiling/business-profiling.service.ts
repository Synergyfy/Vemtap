import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessProfile, ProfilePriority, BusinessInsights, ProfileStatus } from './entities/business-profile.entity';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto } from './dto/business-profile.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BusinessProfilingService {
  constructor(
    @InjectRepository(BusinessProfile)
    private readonly profileRepository: Repository<BusinessProfile>,
  ) {}

  async create(user: User | null, dto: CreateBusinessProfileDto): Promise<BusinessProfile> {
    const { score, priority, insights } = this.calculateProfiling(dto.businessType, dto.physicalSetup);

    const profile = this.profileRepository.create({
      ...dto,
      score,
      priority,
      insights,
      createdById: user?.id,
    });

    return this.profileRepository.save(profile);
  }

  async findAll(user: User, query: { search?: string; priority?: string; status?: string; type?: string }): Promise<BusinessProfile[]> {
    const qb = this.profileRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.createdBy', 'createdBy');

    // Agents only see their own profiles
    if (user.role === 'Agent') {
      qb.andWhere('profile.createdById = :userId', { userId: user.id });
    }

    if (query.search) {
      qb.andWhere('profile.businessName ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.priority) {
      qb.andWhere('profile.priority = :priority', { priority: query.priority });
    }

    if (query.status) {
      qb.andWhere('profile.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('profile.businessType = :type', { type: query.type });
    }

    qb.orderBy('profile.createdAt', 'DESC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<BusinessProfile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }

    return profile;
  }

  async update(id: string, dto: UpdateBusinessProfileDto): Promise<BusinessProfile> {
    const profile = await this.findOne(id);

    // If inputs change, re-calculate scoring and insights
    if (dto.businessType || dto.physicalSetup) {
      const type = dto.businessType || profile.businessType;
      const setup = dto.physicalSetup || profile.physicalSetup;
      const { score, priority, insights } = this.calculateProfiling(type, setup);
      
      Object.assign(profile, { ...dto, score, priority, insights });
    } else {
      Object.assign(profile, dto);
    }

    return this.profileRepository.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.profileRepository.remove(profile);
  }

  async getStats(user: User) {
    const qb = this.profileRepository.createQueryBuilder('profile');
    if (user.role === 'Agent') {
      qb.where('profile.createdById = :userId', { userId: user.id });
    }

    const profiles = await qb.getMany();

    return {
      total: profiles.length,
      high: profiles.filter((p) => p.priority === ProfilePriority.HIGH).length,
      medium: profiles.filter((p) => p.priority === ProfilePriority.MEDIUM).length,
      low: profiles.filter((p) => p.priority === ProfilePriority.LOW).length,
      notContacted: profiles.filter((p) => p.status === ProfileStatus.NOT_CONTACTED).length,
      contacted: profiles.filter((p) => p.status === ProfileStatus.CONTACTED).length,
      interested: profiles.filter((p) => p.status === ProfileStatus.INTERESTED).length,
      closed: profiles.filter((p) => p.status === ProfileStatus.CLOSED).length,
    };
  }

  public calculateProfiling(type?: string, setup: Record<string, any> = {}): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    // 1. Scoring Logic (1-20 Scale)
    const rateFootTraffic = setup.rateFootTraffic || (setup.customerTraffic === 'High' ? 5 : setup.customerTraffic === 'Medium' ? 3 : 1);
    const rateNeed = setup.rateNeed || (setup.problemsNoticed?.length > 2 ? 5 : 3);
    const rateAbilityToPay = setup.rateAbilityToPay || (parseInt(setup.numberOfBranches) > 1 ? 5 : 3);
    const rateEaseOfAdoption = setup.rateEaseOfAdoption || (setup.isDeviceReady && setup.isInternetReady ? 5 : 3);

    const score = Math.min(20, rateFootTraffic + rateNeed + rateAbilityToPay + rateEaseOfAdoption);

    // 2. Priority Logic
    let priority = ProfilePriority.LOW;
    if (score >= 16) priority = ProfilePriority.HIGH;
    else if (score >= 10) priority = ProfilePriority.MEDIUM;

    // 3. Expert System Analysis
    const name = setup.businessName || 'the business';
    const bizType = type || setup.businessType || 'enterprise';
    const traffic = setup.customerTraffic || 'moderate';
    const stakeholders = setup.whoToSpeakTo || 'decision maker';

    // 4. Recommendation Engine
    const recommendations: string[] = [];
    if (setup.hasGlassDoor) {
      recommendations.push(`Capitalize on the storefront glass with high-impact 'Scan & Win' QR stickers to capture ${setup.outsideFootTraffic || 'passing'} traffic.`);
    } else {
      recommendations.push(`Focus on 'Entrance Stand' QR placements to ensure 100% visitor visibility upon arrival.`);
    }

    if (setup.hasTables) {
      recommendations.push(`Deploy permanent NFC/QR table anchors to bridge the gap between dining and digital loyalty.`);
    } else if (setup.hasCounterOrdering) {
      recommendations.push(`Optimize the checkout counter with 'Vemtap Fast-Pass' QR codes to reduce queue friction.`);
    }

    if (setup.problemsNoticed?.includes('No database')) {
      recommendations.push(`Prioritize 'Customer Capture' flow in the demo to show how ${name} can build a private database instantly.`);
    } else {
      recommendations.push(`Use 'Automated Re-engagement' to show how to increase repeat visits for existing customers.`);
    }

    // 5. Pitch Summary Logic
    const mainProblem = setup.problemsNoticed?.[0] || 'manual customer management';
    const pitchSummary = `POWER PITCH: "I noticed ${name} handles ${traffic} traffic primarily through ${mainProblem}. Vemtap can automate your customer database building at the ${setup.hasCounterOrdering ? 'counter' : 'table'} level, turning walk-ins into trackable, loyal assets."`;

    // 6. Deep AI Analysis (Simulated Expert)
    const aiAnalysis = `VEMTAP STRATEGIC ANALYSIS
    
    Current Landscape: ${name} operates as a ${bizType} with ${traffic} foot traffic. The physical infrastructure ${setup.hasGlassDoor ? 'is highly conducive to external QR capture' : 'requires internally focused engagement points'}. With ${setup.numberOfBranches} location(s), the operational complexity is ${parseInt(setup.numberOfBranches) > 1 ? 'scaling' : 'concentrated'}.
    
    Infrastructure & Flow: The ${setup.serviceStyle} service model and ${setup.queueSystem} queue system suggest that ${setup.hasCounterOrdering ? 'counter-top digital interaction' : 'table-side engagement'} will yield the highest conversion. The ${setup.isDeviceReady && setup.isInternetReady ? 'technical readiness is high' : 'technical setup requires initial optimization'} for a seamless demo.
    
    Growth Strategy: To maximize the conversion index (${score}/20), we recommend targeting the ${stakeholders} during ${setup.bestTimeToApproach || 'peak hours'}. The focus should be on ${setup.suggestedPackage} capabilities, specifically addressing the observed ${mainProblem}.`;

    return {
      score,
      priority,
      insights: {
        recommendations,
        suggestedPackage: setup.suggestedPackage || (score >= 15 ? 'Growth' : 'Starter'),
        salesPitch: pitchSummary,
        aiAnalysis,
        pitchSummary,
        aiSource: 'expert-system',
      },
    };
  }
}
