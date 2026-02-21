import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorQueryDto } from './dto/visitor-query.dto';
import {
  VisitorResponseDto,
  PaginatedVisitorResponseDto,
  NewVisitorResponseDto,
  ReturningVisitorResponseDto,
} from './dto/visitor-response.dto';
import { VisitorStatsResponseDto } from './dto/visitor-stats.dto';

@ApiTags('Visitors')
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  private getBusinessId(req: any): string {
    // In a real app, this comes from req.user.businessId
    // Returning a mock ID for development/testing context
    return req.user?.businessId || '123e4567-e89b-12d3-a456-426614174000';
  }

  // --- Stats ---

  @Get('stats')
  @ApiOperation({ summary: 'Get main visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getStats(@Req() req: any): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getStats(this.getBusinessId(req));
  }

  @Get('new/stats')
  @ApiOperation({ summary: 'Get new visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getNewStats(): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getNewStats();
  }

  @Get('returning/stats')
  @ApiOperation({ summary: 'Get returning visitor stats' })
  @ApiResponse({ type: VisitorStatsResponseDto })
  async getReturningStats(): Promise<VisitorStatsResponseDto> {
    return this.visitorsService.getReturningStats();
  }

  // --- Listings ---

  @Get('new')
  @ApiOperation({ summary: 'Get new visitors list' })
  async getNew(@Query() query: VisitorQueryDto, @Req() req: any) {
    return this.visitorsService.findNew(query, this.getBusinessId(req));
  }

  @Get('returning')
  @ApiOperation({ summary: 'Get returning visitors list' })
  async getReturning(@Query() query: VisitorQueryDto, @Req() req: any) {
    return this.visitorsService.findReturning(query, this.getBusinessId(req));
  }

  @Get()
  @ApiOperation({ summary: 'Get all visitors with pagination and filtering' })
  @ApiResponse({ type: PaginatedVisitorResponseDto })
  async findAll(
    @Query() query: VisitorQueryDto,
    @Req() req: any,
  ): Promise<PaginatedVisitorResponseDto> {
    return this.visitorsService.findAll(query, this.getBusinessId(req));
  }

  // --- Actions (Bulk) ---

  @Post('export')
  @ApiOperation({ summary: 'Export visitors to CSV' })
  async export(@Req() req: any) {
    // Mock export
    return {
      message: 'Export started',
      url: 'http://example.com/visitors.csv',
    };
  }

  @Post('campaign')
  @ApiOperation({ summary: 'Send campaign to visitors' })
  async sendCampaign(@Body() body: any) {
    return { message: 'Campaign sent successfully' };
  }

  @Post('welcome-campaign')
  @ApiOperation({ summary: 'Send welcome campaign to new visitors' })
  async sendWelcomeCampaign() {
    return { message: 'Welcome campaign sent successfully' };
  }

  @Post('rewards')
  @ApiOperation({ summary: 'Create a reward for visitors' })
  async createReward(@Body() body: any) {
    return {
      message: 'Reward created',
      id: Math.random().toString(36).substr(2, 9),
    };
  }

  // --- CRUD & Individual Actions ---

  @Post()
  @ApiOperation({ summary: 'Create a new visitor' })
  @ApiResponse({ type: VisitorResponseDto })
  async create(@Body() createVisitorDto: CreateVisitorDto, @Req() req: any) {
    return this.visitorsService.create(
      createVisitorDto,
      this.getBusinessId(req),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a visitor by ID' })
  @ApiResponse({ type: VisitorResponseDto })
  async findOne(@Param('id') id: string) {
    return this.visitorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a visitor' })
  @ApiResponse({ type: VisitorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateVisitorDto: Partial<CreateVisitorDto>,
  ) {
    return this.visitorsService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a visitor' })
  async remove(@Param('id') id: string) {
    return this.visitorsService.remove(id);
  }

  @Post(':id/message')
  @ApiOperation({ summary: 'Send a message to a visitor' })
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return { message: `Message sent to visitor ${id}` };
  }

  @Post(':id/welcome')
  @ApiOperation({ summary: 'Send welcome message to a visitor' })
  async sendWelcome(@Param('id') id: string) {
    return { message: `Welcome message sent to visitor ${id}` };
  }

  @Post(':id/reward')
  @ApiOperation({ summary: 'Send reward to a visitor' })
  async sendReward(@Param('id') id: string) {
    return { message: `Reward sent to visitor ${id}` };
  }
}
