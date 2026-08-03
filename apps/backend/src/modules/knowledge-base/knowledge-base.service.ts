import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KbCategory } from './entities/kb-category.entity';
import { KbSection } from './entities/kb-section.entity';
import { KbPage } from './entities/kb-page.entity';
import {
  CreateKbCategoryDto,
  UpdateKbCategoryDto,
} from './dto/category.dto';
import { CreateKbSectionDto, UpdateKbSectionDto } from './dto/section.dto';
import { CreateKbPageDto, UpdateKbPageDto } from './dto/page.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KbCategory)
    private readonly categoryRepo: Repository<KbCategory>,
    @InjectRepository(KbSection)
    private readonly sectionRepo: Repository<KbSection>,
    @InjectRepository(KbPage)
    private readonly pageRepo: Repository<KbPage>,
  ) {}

  // --- Public Methods ---

  async getPublicTree() {
    const categories = await this.categoryRepo.find({
      order: { order: 'ASC', title: 'ASC' },
      relations: ['sections', 'sections.pages'],
    });

    const formattedCategories = categories.map((cat) => {
      const sections = (cat.sections || [])
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
        .map((sec) => {
          const pages = (sec.pages || [])
            .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
            .map((pg) => ({
              id: pg.id,
              title: pg.title,
              path: pg.path,
              summary: pg.summary,
              thumbnail: pg.thumbnail,
              order: pg.order,
            }));

          return {
            id: sec.id,
            title: sec.title,
            order: sec.order,
            pages,
          };
        });

      return {
        id: cat.id,
        title: cat.title,
        order: cat.order,
        sections,
      };
    });

    return { categories: formattedCategories };
  }

  async getPageById(id: string) {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Knowledge base page not found');
    }
    return {
      id: page.id,
      title: page.title,
      path: page.path,
      summary: page.summary,
      thumbnail: page.thumbnail,
      blocks: page.blocks,
      tips: page.tips,
      categoryId: page.categoryId,
      sectionId: page.sectionId,
      order: page.order,
    };
  }

  async getPageByPath(path: string) {
    if (!path) {
      throw new BadRequestException('Path parameter is required');
    }
    const page = await this.pageRepo.findOne({ where: { path } });
    if (!page) {
      throw new NotFoundException(`Knowledge base page with path '${path}' not found`);
    }
    return {
      id: page.id,
      title: page.title,
      path: page.path,
      summary: page.summary,
      thumbnail: page.thumbnail,
      blocks: page.blocks,
      tips: page.tips,
      categoryId: page.categoryId,
      sectionId: page.sectionId,
      order: page.order,
    };
  }

  // --- Admin Category Methods ---

  async createCategory(dto: CreateKbCategoryDto) {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: UpdateKbCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.categoryRepo.remove(category);
  }

  // --- Admin Section Methods ---

  async createSection(dto: CreateKbSectionDto) {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Specified category does not exist');
    }
    const section = this.sectionRepo.create(dto);
    return this.sectionRepo.save(section);
  }

  async updateSection(id: string, dto: UpdateKbSectionDto) {
    const section = await this.sectionRepo.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Specified category does not exist');
      }
    }
    Object.assign(section, dto);
    return this.sectionRepo.save(section);
  }

  async deleteSection(id: string) {
    const section = await this.sectionRepo.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return this.sectionRepo.remove(section);
  }

  // --- Admin Page Methods ---

  async createPage(dto: CreateKbPageDto) {
    const existingPath = await this.pageRepo.findOne({
      where: { path: dto.path },
    });
    if (existingPath) {
      throw new ConflictException(`Page with path '${dto.path}' already exists`);
    }

    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Specified category does not exist');
    }

    const section = await this.sectionRepo.findOne({
      where: { id: dto.sectionId },
    });
    if (!section) {
      throw new BadRequestException('Specified section does not exist');
    }

    const page = this.pageRepo.create(dto);
    return this.pageRepo.save(page);
  }

  async updatePage(id: string, dto: UpdateKbPageDto) {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (dto.path && dto.path !== page.path) {
      const existingPath = await this.pageRepo.findOne({
        where: { path: dto.path },
      });
      if (existingPath) {
        throw new ConflictException(`Page with path '${dto.path}' already exists`);
      }
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Specified category does not exist');
      }
    }

    if (dto.sectionId) {
      const section = await this.sectionRepo.findOne({
        where: { id: dto.sectionId },
      });
      if (!section) {
        throw new BadRequestException('Specified section does not exist');
      }
    }

    Object.assign(page, dto);
    return this.pageRepo.save(page);
  }

  async deletePage(id: string) {
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return this.pageRepo.remove(page);
  }
}
