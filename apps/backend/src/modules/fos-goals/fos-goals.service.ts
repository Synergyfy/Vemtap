import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, Project } from './entities/goal.entity';
import {
  CreateGoalDto,
  UpdateGoalDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/goal.dto';

@Injectable()
export class FosGoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  private toGoalDto(g: Goal) {
    return {
      id: g.id,
      name: g.name,
      target: this.toNumber(g.target),
      current: this.toNumber(g.current),
      deadline: g.deadline,
      category: g.category,
    };
  }

  private toProjectDto(p: Project) {
    return {
      id: p.id,
      name: p.name,
      budget: this.toNumber(p.budget),
      spent: this.toNumber(p.spent),
      revenue: this.toNumber(p.revenue),
      status: p.status || 'IN_PROGRESS',
      deadline: p.deadline,
    };
  }

  async getGoals() {
    const [goals, projects] = await Promise.all([
      this.goalRepo.find({ order: { createdAt: 'ASC' } }),
      this.projectRepo.find({ order: { createdAt: 'ASC' } }),
    ]);

    return {
      goals: goals.map((g) => this.toGoalDto(g)),
      projects: projects.map((p) => this.toProjectDto(p)),
    };
  }

  async createGoal(dto: CreateGoalDto) {
    const goal = this.goalRepo.create({
      name: dto.name,
      target: dto.target,
      current: dto.current ?? 0,
      deadline: dto.deadline ?? undefined,
      category: dto.category ?? undefined,
    });
    const saved = await this.goalRepo.save(goal);
    return this.toGoalDto(saved);
  }

  async updateGoal(id: string, dto: UpdateGoalDto) {
    const goal = await this.goalRepo.findOne({ where: { id } });
    if (!goal) {
      throw new NotFoundException(`Goal with id ${id} not found`);
    }

    if (dto.name !== undefined) goal.name = dto.name;
    if (dto.target !== undefined) goal.target = dto.target;
    if (dto.current !== undefined) goal.current = dto.current;
    if (dto.deadline !== undefined) goal.deadline = dto.deadline;
    if (dto.category !== undefined) goal.category = dto.category;

    const saved = await this.goalRepo.save(goal);
    return this.toGoalDto(saved);
  }

  async removeGoal(id: string) {
    const goal = await this.goalRepo.findOne({ where: { id } });
    if (!goal) {
      throw new NotFoundException(`Goal with id ${id} not found`);
    }
    await this.goalRepo.remove(goal);
    return { success: true };
  }

  async createProject(dto: CreateProjectDto) {
    const project = this.projectRepo.create({
      name: dto.name,
      budget: dto.budget ?? 0,
      spent: dto.spent ?? 0,
      revenue: dto.revenue ?? 0,
      status: dto.status ?? 'IN_PROGRESS',
      deadline: dto.deadline ?? undefined,
    });
    const saved = await this.projectRepo.save(project);
    return this.toProjectDto(saved);
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.budget !== undefined) project.budget = dto.budget;
    if (dto.spent !== undefined) project.spent = dto.spent;
    if (dto.revenue !== undefined) project.revenue = dto.revenue;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.deadline !== undefined) project.deadline = dto.deadline;

    const saved = await this.projectRepo.save(project);
    return this.toProjectDto(saved);
  }

  async removeProject(id: string) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    await this.projectRepo.remove(project);
    return { success: true };
  }
}
