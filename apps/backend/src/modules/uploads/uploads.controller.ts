import {
  BadRequestException,
  Controller,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { UploadsService } from './uploads.service';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB, matching the web route
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException('Only JPG, PNG or WebP images are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Upload a business image (logo, cover or gallery)',
    description:
      'Accepts multipart/form-data `file` (JPG/PNG/WebP, max 10MB) and returns the hosted URL.',
  })
  @ApiResponse({
    status: 201,
    description: 'Uploaded successfully',
    schema: { example: { url: 'https://res.cloudinary.com/.../logo.png' } },
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { businessId?: string } },
  ) {
    return this.uploadsService.uploadImage(file, req.user?.businessId);
  }
}
