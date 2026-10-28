import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { GeocodingService } from '../../geocoding/geocoding.service';

export const GEOCODING_QUEUE = 'geocoding';

export interface GeocodingJobData {
  businessId: string;
  branchId: string;
  addressLine: string;
  city?: string;
  state?: string;
  country?: string;
  updateBusiness?: boolean;
}

@Processor(GEOCODING_QUEUE, { concurrency: 3 })
export class GeocodingProcessor extends WorkerHost {
  private readonly logger = new Logger(GeocodingProcessor.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly geocodingService: GeocodingService,
  ) {
    super();
  }

  async process(job: Job<GeocodingJobData, any, string>): Promise<void> {
    const { businessId, branchId, addressLine, city, state, country } =
      job.data;

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['latitude', 'longitude'],
    });

    if (branch?.latitude && branch?.longitude) {
      this.logger.log(
        `Branch ${branchId} already has coordinates — skipping geocoding`,
      );
      return;
    }

    const fullAddress = [addressLine, city, state, country]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      this.logger.warn(`No address to geocode for business ${businessId}`);
      return;
    }

    // Google when GOOGLE_MAPS_API_KEY is set, otherwise (or on failure) Nominatim.
    const point = await this.geocodingService.geocodeAddress(fullAddress);
    if (!point) {
      throw new Error(`Could not geocode address for business ${businessId}`);
    }
    const { lat, lng } = point;

    const promises = [
      this.branchRepository.update(branchId, { latitude: lat, longitude: lng }),
    ];
    if (job.data.updateBusiness !== false) {
      promises.push(
        this.businessesRepository.update(businessId, {
          latitude: lat,
          longitude: lng,
        }),
      );
    }
    await Promise.all(promises);

    this.logger.log(
      `Updated lat/lng for business ${businessId} (${lat}, ${lng})`,
    );
  }
}
