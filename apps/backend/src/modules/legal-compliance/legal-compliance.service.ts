import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalAgreement } from './entities/legal-agreement.entity';
import { LegalAgreementAcceptance } from './entities/legal-agreement-acceptance.entity';
import { CreateAgreementDto, UpdateAgreementDto } from './dto/create-agreement.dto';
import {
  AgreementResponseDto,
  AgreementHistoryResponseDto,
  PaginatedAgreementHistoryDto,
} from './dto/agreement-response.dto';

@Injectable()
export class LegalComplianceService {
  constructor(
    @InjectRepository(LegalAgreement)
    private agreementRepository: Repository<LegalAgreement>,
    @InjectRepository(LegalAgreementAcceptance)
    private acceptanceRepository: Repository<LegalAgreementAcceptance>,
  ) {}

  async findAll(userId: string): Promise<AgreementResponseDto[]> {
    const agreements = await this.agreementRepository.find({
      where: { isActive: true },
      order: { effectiveDate: 'DESC' },
    });

    const acceptances = await this.acceptanceRepository.find({
      where: { userId },
      relations: ['agreement'],
    });

    const acceptanceMap = new Map(
      acceptances.map((a) => [a.agreementId, a]),
    );

    return agreements.map((agreement) => {
      const acceptance = acceptanceMap.get(agreement.id);
      return {
        id: agreement.id,
        name: agreement.name,
        slug: agreement.slug,
        version: agreement.version,
        contentUrl: agreement.contentUrl,
        effectiveDate: agreement.effectiveDate,
        isActive: agreement.isActive,
        acceptance: acceptance
          ? {
              id: acceptance.id,
              version: acceptance.version,
              acceptedAt: acceptance.acceptedAt,
              ipAddress: acceptance.ipAddress,
              userAgent: acceptance.userAgent,
            }
          : null,
      };
    });
  }

  async findBySlug(slug: string): Promise<LegalAgreement> {
    const agreement = await this.agreementRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!agreement) {
      throw new NotFoundException(`Agreement "${slug}" not found`);
    }
    return agreement;
  }

  async getAcceptance(
    slug: string,
    userId: string,
  ): Promise<LegalAgreementAcceptance | null> {
    const agreement = await this.findBySlug(slug);
    return this.acceptanceRepository.findOne({
      where: { agreementId: agreement.id, userId },
    });
  }

  async getHistory(
    slug: string,
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedAgreementHistoryDto> {
    const agreement = await this.findBySlug(slug);
    const skip = (page - 1) * limit;

    const qb = this.acceptanceRepository
      .createQueryBuilder('acceptance')
      .leftJoinAndSelect('acceptance.user', 'user')
      .where('acceptance.agreementId = :agreementId', {
        agreementId: agreement.id,
      });

    if (businessId) {
      qb.andWhere('user.businessId = :businessId', { businessId });
    }

    const [acceptances, total] = await qb
      .orderBy('acceptance.acceptedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: acceptances.map((a) => {
        const ua = this.parseUserAgent(a.userAgent);
        return {
          id: a.id,
          doc: agreement.name,
          version: a.version,
          date: a.acceptedAt,
          ip: a.ipAddress,
          browser: ua.browser,
          os: ua.os,
          action: 'View',
        };
      }),
      total,
      page,
      limit,
    };
  }

  async accept(
    slug: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    signatureHash?: string,
  ): Promise<LegalAgreementAcceptance> {
    const agreement = await this.findBySlug(slug);

    const existing = await this.acceptanceRepository.findOne({
      where: { agreementId: agreement.id, userId },
    });

    if (existing) {
      throw new BadRequestException(
        `You have already accepted "${agreement.name}"`,
      );
    }

    const acceptance = this.acceptanceRepository.create({
      agreementId: agreement.id,
      userId,
      version: agreement.version,
      ipAddress,
      userAgent,
      acceptedAt: new Date(),
      signatureHash,
    });

    return this.acceptanceRepository.save(acceptance);
  }

  async create(dto: CreateAgreementDto): Promise<LegalAgreement> {
    const existing = await this.agreementRepository.findOne({
      where: { slug: dto.slug },
      withDeleted: true,
    });
    if (existing) {
      throw new BadRequestException(
        `An agreement with slug "${dto.slug}" already exists`,
      );
    }

    const agreement = this.agreementRepository.create({
      name: dto.name,
      slug: dto.slug,
      version: dto.version,
      contentUrl: dto.contentUrl,
      effectiveDate: new Date(dto.effectiveDate),
      isActive: dto.isActive ?? true,
    });

    return this.agreementRepository.save(agreement);
  }

  async findAllAdmin(): Promise<LegalAgreement[]> {
    return this.agreementRepository.find({
      order: { effectiveDate: 'DESC' },
      withDeleted: true,
    });
  }

  async update(
    id: string,
    dto: UpdateAgreementDto,
  ): Promise<LegalAgreement> {
    const agreement = await this.agreementRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!agreement) {
      throw new NotFoundException(`Agreement with id "${id}" not found`);
    }

    if (dto.name !== undefined) agreement.name = dto.name;
    if (dto.version !== undefined) agreement.version = dto.version;
    if (dto.contentUrl !== undefined) agreement.contentUrl = dto.contentUrl;
    if (dto.effectiveDate !== undefined)
      agreement.effectiveDate = new Date(dto.effectiveDate);
    if (dto.isActive !== undefined) agreement.isActive = dto.isActive;

    return this.agreementRepository.save(agreement);
  }

  async remove(id: string): Promise<void> {
    const agreement = await this.agreementRepository.findOne({
      where: { id },
    });
    if (!agreement) {
      throw new NotFoundException(`Agreement with id "${id}" not found`);
    }
    await this.agreementRepository.softDelete(id);
  }

  private parseUserAgent(
    ua?: string,
  ): { browser: string; os: string } {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };

    let browser = 'Unknown';
    let os = 'Unknown';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    const versionMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/([\d.]+)/);
    if (versionMatch) {
      browser = `${versionMatch[1]} ${versionMatch[2]}`;
    }

    return { browser, os };
  }
}
