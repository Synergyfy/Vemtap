import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import axios from 'axios';

export interface DojahNinVerificationInput {
  documentUrl: string;
  nin: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface DojahCacVerificationInput {
  documentUrl: string;
  cacNumber: string;
  businessName: string;
  email?: string;
  phoneNumber?: string;
}

export interface DojahVerificationResult {
  success: boolean;
  verificationId: string;
  status: 'verified' | 'failed' | 'pending';
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly configured: boolean;
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('DOJAH_APP_ID') ?? '';
    this.secretKey = this.configService.get<string>('DOJAH_SECRET_KEY') ?? '';
    this.baseUrl = this.configService.get<string>('DOJAH_BASE_URL') ?? 'https://api.dojah.io/api/v1';

    this.configured = Boolean(this.appId && this.secretKey);

    if (!this.configured) {
      this.logger.warn('Dojah KYC not configured - missing DOJAH_APP_ID or DOJAH_SECRET_KEY');
    }
  }

  private getHeaders() {
    return {
      AppId: this.appId,
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async verifyNin(input: DojahNinVerificationInput): Promise<DojahVerificationResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Identity verification service is not configured');
    }

    try {
      const response = await axios.post<DojahVerificationResult>(
        `${this.baseUrl}/kyc/nin`,
        {
          document_url: input.documentUrl,
          nin: input.nin,
          first_name: input.firstName,
          last_name: input.lastName,
          phone_number: input.phoneNumber,
        },
        { headers: this.getHeaders() },
      );

      return response.data;
    } catch (error) {
      this.handleError('NIN verification', error);
      throw error;
    }
  }

  async verifyCac(input: DojahCacVerificationInput): Promise<DojahVerificationResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Business verification service is not configured');
    }

    try {
      const response = await axios.post<DojahVerificationResult>(
        `${this.baseUrl}/kyc/cac`,
        {
          document_url: input.documentUrl,
          cac_number: input.cacNumber,
          business_name: input.businessName,
          email: input.email,
          phone_number: input.phoneNumber,
        },
        { headers: this.getHeaders() },
      );

      return response.data;
    } catch (error) {
      this.handleError('CAC verification', error);
      throw error;
    }
  }

  private handleError(context: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? HttpStatus.BAD_GATEWAY;
      const message = (axiosError.response?.data as { message?: string })?.message ?? axiosError.message;

      this.logger.error(`${context} failed`, {
        status,
        message,
        response: axiosError.response?.data,
      });

      if (status === HttpStatus.UNAUTHORIZED) {
        throw new ServiceUnavailableException('Verification service authentication failed');
      }
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        throw new ServiceUnavailableException('Verification service rate limited - please try again later');
      }

      throw new HttpException(
        { message: `${context} failed: ${message}`, statusCode: status },
        status,
      );
    }

    this.logger.error(`${context} unexpected error`, error);
    throw new BadRequestException(`${context} failed unexpectedly`);
  }
}