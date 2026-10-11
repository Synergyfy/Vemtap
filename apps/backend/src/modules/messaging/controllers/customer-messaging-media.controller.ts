import {
  BadRequestException,
  Controller,
  Post,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { SkipSubscriptionCheck } from '../../subscriptions/decorators/skip-subscription-check.decorator';
import { UploadsService } from '../../uploads/uploads.service';
import { InboxService } from '../services/inbox.service';

/**
 * Media for customer-side chats.
 *
 * Deliberately not `POST /uploads`: that route is business-only and files into
 * a business's Cloudinary folder, so a customer has neither the role nor the
 * folder. Same size and type limits as that route, so an image a merchant can
 * send, a customer can too.
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('customer messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('customer/messaging')
export class CustomerMessagingMediaController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('media')
  @SkipSubscriptionCheck()
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
    summary: 'Upload an image to send in a chat',
    description:
      'Accepts multipart/form-data `file` (JPG/PNG/WebP, max 10MB) and returns the hosted URL to pass as `mediaUrl` when replying.',
  })
  @ApiResponse({
    status: 201,
    description: 'Uploaded successfully',
    schema: { example: { url: 'https://res.cloudinary.com/.../photo.jpg' } },
  })
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadImage(file, undefined, 'vemtap/messaging');
  }
}