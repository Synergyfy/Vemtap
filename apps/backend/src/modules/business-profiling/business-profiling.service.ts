import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BusinessProfile,
  ProfilePriority,
  BusinessInsights,
  ProfileStatus,
} from './entities/business-profile.entity';
import {
  CreateBusinessProfileDto,
  UpdateBusinessProfileDto,
} from './dto/business-profile.dto';
import { User } from '../users/entities/user.entity';
import { ProfilingLogicHelper } from './profiling-logic.helper';
import { GeminiService } from './gemini.service';

@Injectable()
export class BusinessProfilingService {
  private readonly logger = new Logger(BusinessProfilingService.name);

  constructor(
    @InjectRepository(BusinessProfile)
    private readonly profileRepository: Repository<BusinessProfile>,
    private readonly geminiService: GeminiService,
  ) {}

  async create(
    user: User | null,
    dto: CreateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    const {
      score,
      priority,
      insights: expertInsights,
    } = this.calculateProfiling(
      dto.businessType,
      dto.physicalSetup,
      dto.responses,
    );

    let finalInsights = expertInsights;
    try {
      const aiResult = await this.geminiService.generateInsights({
        ...dto,
        expertScore: score,
        expertPriority: priority,
      });

      finalInsights = {
        ...aiResult,
        aiSource: 'gemini-1.5-flash',
        pitchSummary: aiResult.salesPitch,
      } as any;
    } catch (error) {
      this.logger.error(
        'AI Insight generation failed, falling back to expert system',
        error,
      );
    }

    const profile = this.profileRepository.create({
      ...dto,
      score,
      priority,
      insights: finalInsights,
      createdById: user?.id,
    });

    return this.profileRepository.save(profile);
  }

  async findAll(
    user: User,
    query: {
      search?: string;
      priority?: string;
      status?: string;
      type?: string;
    },
  ): Promise<BusinessProfile[]> {
    const qb = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.createdBy', 'createdBy');

    // Agents only see their own profiles
    if (user.role === 'Agent') {
      qb.andWhere('profile.createdById = :userId', { userId: user.id });
    }

    if (query.search) {
      qb.andWhere('profile.businessName ILIKE :search', {
        search: `%${query.search}%`,
      });
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

  async update(
    id: string,
    dto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfile> {
    const profile = await this.findOne(id);

    // If inputs change, re-calculate scoring and insights
    if (dto.businessType || dto.physicalSetup || dto.responses) {
      const type = dto.businessType || profile.businessType;
      const setup = dto.physicalSetup || profile.physicalSetup;
      const responses = dto.responses || profile.responses;
      const {
        score,
        priority,
        insights: expertInsights,
      } = this.calculateProfiling(type, setup, responses);

      let finalInsights = expertInsights;
      try {
        const aiResult = await this.geminiService.generateInsights({
          ...profile,
          ...dto,
          expertScore: score,
          expertPriority: priority,
        });

        finalInsights = {
          ...aiResult,
          aiSource: 'gemini-1.5-flash',
          pitchSummary: aiResult.salesPitch,
        } as any;
      } catch (error) {
        this.logger.error(
          'AI Update failed, falling back to expert system',
          error,
        );
      }

      Object.assign(profile, {
        ...dto,
        score,
        priority,
        insights: finalInsights,
      });
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
      medium: profiles.filter((p) => p.priority === ProfilePriority.MEDIUM)
        .length,
      low: profiles.filter((p) => p.priority === ProfilePriority.LOW).length,
      notContacted: profiles.filter(
        (p) => p.status === ProfileStatus.NOT_CONTACTED,
      ).length,
      contacted: profiles.filter((p) => p.status === ProfileStatus.CONTACTED)
        .length,
      interested: profiles.filter((p) => p.status === ProfileStatus.INTERESTED)
        .length,
      closed: profiles.filter((p) => p.status === ProfileStatus.CLOSED).length,
    };
  }

  public calculateProfiling(
    type?: string,
    setup: Record<string, any> = {},
    responses: Record<string, any> = {},
  ): { score: number; priority: ProfilePriority; insights: BusinessInsights } {
    const data: any = {
      ...setup,
      ...responses,
      businessName: setup.businessName || responses.businessName,
    };

    // Use specific logic if category is matched
    if (type === 'Retail & Shops' || data.businessType === 'Retail & Shops') {
      return ProfilingLogicHelper.calculateRetail(data);
    }

    if (
      type === 'Food & Hospitality' ||
      data.businessType === 'Food & Hospitality'
    ) {
      return ProfilingLogicHelper.calculateFood(data);
    }

    if (
      type === 'Beauty & Personal Care' ||
      data.businessType === 'Beauty & Personal Care'
    ) {
      return ProfilingLogicHelper.calculateBeauty(data);
    }

    if (
      type === 'Health & Medical' ||
      data.businessType === 'Health & Medical'
    ) {
      return ProfilingLogicHelper.calculateHealth(data);
    }

    if (
      type === 'Professional Services' ||
      data.businessType === 'Professional Services'
    ) {
      return ProfilingLogicHelper.calculateProfessional(data);
    }

    if (
      type === 'Education & Training' ||
      data.businessType === 'Education & Training'
    ) {
      return ProfilingLogicHelper.calculateEducation(data);
    }

    if (
      type === 'Technology & Digital Service' ||
      data.businessType === 'Technology & Digital Service'
    ) {
      return ProfilingLogicHelper.calculateTech(data);
    }

    if (
      type === 'Real Estate & Property' ||
      data.businessType === 'Real Estate & Property'
    ) {
      return ProfilingLogicHelper.calculateRealEstate(data);
    }

    if (type === 'Automotive' || data.businessType === 'Automotive') {
      return ProfilingLogicHelper.calculateAutomotive(data);
    }

    if (
      type === 'Logistics & Transportation' ||
      data.businessType === 'Logistics & Transportation'
    ) {
      return ProfilingLogicHelper.calculateLogistics(data);
    }

    if (
      type === 'Construction & Home Service' ||
      type === 'Construction & Home Services' ||
      data.businessType === 'Construction & Home Service' ||
      data.businessType === 'Construction & Home Services'
    ) {
      return ProfilingLogicHelper.calculateConstruction(data);
    }

    if (
      type === 'Event & Entertainment' ||
      data.businessType === 'Event & Entertainment'
    ) {
      return ProfilingLogicHelper.calculateEvents(data);
    }

    if (
      type === 'Agriculture & Farming' ||
      data.businessType === 'Agriculture & Farming'
    ) {
      return ProfilingLogicHelper.calculateAgric(data);
    }

    if (
      type === 'Finance & Financial Services' ||
      data.businessType === 'Finance & Financial Services'
    ) {
      return ProfilingLogicHelper.calculateFinance(data);
    }

    if (
      type === 'Government & Public Service' ||
      data.businessType === 'Government & Public Service'
    ) {
      return ProfilingLogicHelper.calculateGov(data);
    }

    if (
      type === 'Religious & Non-Profit Organizations' ||
      data.businessType === 'Religious & Non-Profit Organizations' ||
      type === 'Religion & NGO' ||
      data.businessType === 'Religion & NGO'
    ) {
      return ProfilingLogicHelper.calculateReligion(data);
    }

    if (type === 'Other' || data.businessType === 'Other') {
      return ProfilingLogicHelper.calculateOther(data);
    }

    // 1. Scoring Logic (1-20 Scale)
    const rateFootTraffic =
      data.rateFootTraffic ||
      (data.customerTraffic === 'High'
        ? 5
        : data.customerTraffic === 'Medium'
          ? 3
          : 1);
    const rateNeed =
      data.rateNeed || (data.problemsNoticed?.length > 2 ? 5 : 3);
    const rateAbilityToPay =
      data.rateAbilityToPay || (parseInt(data.numberOfBranches) > 1 ? 5 : 3);
    const rateEaseOfAdoption =
      data.rateEaseOfAdoption ||
      (data.isDeviceReady && data.isInternetReady ? 5 : 3);

    const score = Math.min(
      20,
      rateFootTraffic + rateNeed + rateAbilityToPay + rateEaseOfAdoption,
    );

    // 2. Priority Logic
    let priority = ProfilePriority.LOW;
    if (score >= 16) priority = ProfilePriority.HIGH;
    else if (score >= 10) priority = ProfilePriority.MEDIUM;

    // 3. Expert System Analysis
    const name = data.businessName || 'the business';
    const bizType = type || data.businessType || 'enterprise';
    const traffic = data.customerTraffic || 'moderate';
    const stakeholders = data.whoToSpeakTo || 'decision maker';

    // 4. Recommendation Engine
    const recommendations: string[] = [];
    if (data.hasGlassDoor) {
      recommendations.push(
        `Capitalize on the storefront glass with high-impact 'Scan & Win' QR stickers to capture ${data.outsideFootTraffic || 'passing'} traffic.`,
      );
    } else {
      recommendations.push(
        `Focus on 'Entrance Stand' QR placements to ensure 100% visitor visibility upon arrival.`,
      );
    }

    if (data.hasTables) {
      recommendations.push(
        `Deploy permanent NFC/QR table anchors to bridge the gap between dining and digital loyalty.`,
      );
    } else if (data.hasCounterOrdering) {
      recommendations.push(
        `Optimize the checkout counter with 'Vemtap Fast-Pass' QR codes to reduce queue friction.`,
      );
    }

    if (data.problemsNoticed?.includes('No database')) {
      recommendations.push(
        `Prioritize 'Customer Capture' flow in the demo to show how ${name} can build a private database instantly.`,
      );
    } else {
      recommendations.push(
        `Use 'Automated Re-engagement' to show how to increase repeat visits for existing customers.`,
      );
    }

    // 5. Pitch Summary Logic
    const mainProblem =
      data.problemsNoticed?.[0] || 'manual customer management';
    const pitchSummary = `POWER PITCH: "I noticed ${name} handles ${traffic} traffic primarily through ${mainProblem}. Vemtap can automate your customer database building at the ${data.hasCounterOrdering ? 'counter' : 'table'} level, turning walk-ins into trackable, loyal assets."`;

    // 6. Deep AI Analysis (Simulated Expert)
    const aiAnalysis = `VEMTAP STRATEGIC ANALYSIS
    
    Current Landscape: ${name} operates as a ${bizType} with ${traffic} foot traffic. The physical infrastructure ${data.hasGlassDoor ? 'is highly conducive to external QR capture' : 'requires internally focused engagement points'}. With ${data.numberOfBranches} location(s), the operational complexity is ${parseInt(data.numberOfBranches) > 1 ? 'scaling' : 'concentrated'}.
    
    Infrastructure & Flow: The ${data.serviceStyle} service model and ${data.queueSystem} queue system suggest that ${data.hasCounterOrdering ? 'counter-top digital interaction' : 'table-side engagement'} will yield the highest conversion. The ${data.isDeviceReady && data.isInternetReady ? 'technical readiness is high' : 'technical setup requires initial optimization'} for a seamless demo.
    
    Growth Strategy: To maximize the conversion index (${score}/20), we recommend targeting the ${stakeholders} during ${data.bestTimeToApproach || 'peak hours'}. The focus should be on ${data.suggestedPackage} capabilities, specifically addressing the observed ${mainProblem}.`;

    const summary = `This is a ${bizType} that currently handles ${traffic} foot traffic. They are mostly facing issues with ${mainProblem}.`;
    const problems = data.problemsNoticed || [
      'No structured customer database',
      'Manual customer tracking',
    ];
    const suggestedPackage =
      data.suggestedPackage ||
      (score >= 15 ? 'Platinum' : score >= 10 ? 'Gold' : 'Silver');
    const packageReason = `Recommended because the business has ${traffic} traffic and needs efficient tools to handle their volume.`;
    const qrStrategy = data.qrStrategy || [
      'Menu/Catalog QR (for browsing)',
      'Feedback QR (for engagement)',
    ];

    return {
      score,
      priority,
      insights: {
        summary,
        problems,
        recommendations,
        suggestedPackage,
        packageReason,
        qrStrategy,
        salesPitch: pitchSummary,
        aiAnalysis,
        pitchSummary,
        aiSource: 'expert-system',
      },
    };
  }
}
