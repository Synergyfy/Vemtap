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

// Vercel caps serverless request bodies at ~4.5MB, so anything larger is
// rejected by the platform before multer ever sees it. 4MB keeps the in-code
// limit under that cliff instead of advertising a size the deploy can't take.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB, under the Vercel body cap
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

const ALLOWED_FOLDER = /^vemtap\/(avatars|users|messaging|businesses)\/[a-z0-9-]+$/i;

// ... existing constants

  @Post()
  @SkipSubscriptionCheck()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.CUSTOMER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
callback(
      new BadRequestException('Only JPG, PNG, WebP or PDF images are allowed'),
          );
        } else if (
          folderOverride &&
          !ALLOWED_FOLDER.test(folderOverride)
        ) {
          callback(
            new BadRequestException(
              'Invalid folder override. Allowed prefixes: vemtap/avatars, vemtap/users, vemtap/messaging, vemtap/businesses',
            ),
          );
        } else {
          callback(null);
        }
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
    summary: 'Upload an image (business logo/cover/gallery, or user avatar)',
    description:
      'Accepts multipart/form-data `file` (JPG/PNG/WebP, max 4MB — kept under ' +
      "the serverless body cap) and returns the hosted URL. Owners, managers " +
      'and admins land in `vemtap/businesses/{businessId}`; customers with no ' +
      'business context land in `vemtap/users/{userId}`, which is where the ' +
      'profile-picture flow puts avatars before PATCHing them onto the user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Uploaded successfully',
    schema: { example: { url: 'https://res.cloudinary.com/.../logo.png' } },
  })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string; businessId?: string }; body?: { folderOverride?: string } },
  ) {
    const user = req.user;
    const folderOverride = req.body?.folderOverride;
    const folder = folderOverride
      ? folderOverride
      : user?.businessId
        ? undefined
        : user?.id
          ? `vemtap/users/${user.id}`
          : undefined;
    return this.uploadsService.uploadImage(file, user?.businessId, folder);
  }
}
