import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';

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

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Processor(GEOCODING_QUEUE, { concurrency: 3 })
export class GeocodingProcessor extends WorkerHost {
  private readonly logger = new Logger(GeocodingProcessor.name);

  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {
    super();
  }

  async process(job: Job<GeocodingJobData, any, string>): Promise<void> {
    const { businessId, branchId, addressLine, city, state, country } = job.data;

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['latitude', 'longitude'],
    });

    if (branch?.latitude && branch?.longitude) {
      this.logger.log(`Branch ${branchId} already has coordinates — skipping geocoding`);
      return;
    }

    const fullAddress = [addressLine, city, state, country]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      this.logger.warn(`No address to geocode for business ${businessId}`);
      return;
    }

    let lat: number;
    let lng: number;

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const result = await this.geocodeWithGoogle(fullAddress, googleApiKey);
        lat = result.lat;
        lng = result.lng;
        this.logger.log(`Geocoded business ${businessId} via Google Maps`);
      } catch (err) {
        this.logger.warn(`Google Maps geocoding failed for ${businessId}, falling back to Nominatim: ${err.message}`);
        const result = await this.geocodeWithNominatim(fullAddress);
        lat = result.lat;
        lng = result.lng;
      }
    } else {
      const result = await this.geocodeWithNominatim(fullAddress);
      lat = result.lat;
      lng = result.lng;
    }

    const promises = [this.branchRepository.update(branchId, { latitude: lat, longitude: lng })];
    if (job.data.updateBusiness !== false) {
      promises.push(this.businessesRepository.update(businessId, { latitude: lat, longitude: lng }));
    }
    await Promise.all(promises);

    this.logger.log(`Updated lat/lng for business ${businessId} (${lat}, ${lng})`);
  }

  private async geocodeWithGoogle(address: string, apiKey: string): Promise<{ lat: number; lng: number }> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(`Google geocoding failed: ${data.status}`);
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  }

  private async geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number }> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'VemTap/1.0' } },
    );

    if (!res.ok) {
      throw new Error(`Nominatim returned ${res.status}`);
    }

    const data: NominatimResult[] = await res.json();

    if (!data?.length) {
      throw new Error(`Nominatim could not find address: ${address}`);
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  }
}
