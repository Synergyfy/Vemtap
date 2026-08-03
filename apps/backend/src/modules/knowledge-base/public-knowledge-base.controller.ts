import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Knowledge Base')
@Controller('knowledge-base')
export class PublicKnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get full knowledge base category/section/page tree' })
  async getTree() {
    return this.kbService.getPublicTree();
  }

  @Public()
  @Get('pages/by-path')
  @ApiOperation({ summary: 'Get page by path query string' })
  async getPageByPath(@Query('path') path: string) {
    return this.kbService.getPageByPath(path);
  }

  @Public()
  @Get('pages/:id')
  @ApiOperation({ summary: 'Get full page details by ID' })
  async getPageById(@Param('id', ParseUUIDPipe) id: string) {
    return this.kbService.getPageById(id);
  }
}
