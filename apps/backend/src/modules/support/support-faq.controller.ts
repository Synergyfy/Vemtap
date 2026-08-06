import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

@ApiTags('Support FAQs')
@Controller('support')
export class SupportFaqController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Public()
  @Get('faqs')
  @ApiOperation({ summary: 'Get public support FAQs' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getFaqs(@Query('search') search?: string) {
    const tree = await this.knowledgeBaseService.getPublicTree();
    if (!search?.trim()) return tree;

    const needle = search.trim().toLowerCase();
    return {
      categories: tree.categories
        .map((category) => ({
          ...category,
          sections: category.sections
            .map((section) => ({
              ...section,
              pages: section.pages.filter((page) =>
                `${page.title} ${page.summary || ''}`
                  .toLowerCase()
                  .includes(needle),
              ),
            }))
            .filter((section) => section.pages.length > 0),
        }))
        .filter((category) => category.sections.length > 0),
    };
  }
}
