import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BrandRulesService } from '../services/brand-rules.service';
import { SaveBrandRuleDto } from '../dto/save-brand-rule.dto';
import { MarketingBrandRule } from '../entities/marketing-brand-rule.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Marketing Brand Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing-brand-rules')
export class BrandRulesController {
  constructor(private readonly brandRulesService: BrandRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get brand validation rules for current business' })
  @ApiResponse({ status: 200, type: MarketingBrandRule })
  getRules(@Req() req: RequestWithUser) {
    return this.brandRulesService.getRules(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Save or update brand validation rules' })
  @ApiResponse({ status: 200, type: MarketingBrandRule })
  saveRules(@Req() req: RequestWithUser, @Body() dto: SaveBrandRuleDto) {
    return this.brandRulesService.saveRules(req.user, dto);
  }
}
