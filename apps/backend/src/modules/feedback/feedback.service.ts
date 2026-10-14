import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateFeedbackDto, customer: User) {
    const branch = await this.feedbackRepository.manager
      .getRepository(Branch)
      .findOne({
        where: { id: dto.branchId },
      });
    if (!branch) throw new NotFoundException('Branch not found');

    const feedback = this.feedbackRepository.create({
      branchId: branch.id,
      businessId: branch.businessId,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      rating: dto.rating,
      comment: dto.comment.trim(),
      status: 'new',
      sentiment:
        dto.rating >= 4 ? 'positive' : dto.rating <= 2 ? 'negative' : 'neutral',
    });
    const saved = await this.feedbackRepository.save(feedback);

    // A rating is the one thing a venue owner will open an app for. Fire it to
    // the branch and the business so it lands in the same bell as everything
    // else, rather than only in the review list nobody watches.
    const author = feedback.customerName || 'A customer';
    this.notificationsService
      .createForBranchStaff(
        branch.id,
        branch.businessId,
        `New ${dto.rating}★ Rating`,
        `${author} left a ${dto.rating}-star rating${dto.comment.trim() ? `: "${dto.comment.trim()}"` : ''}`,
        dto.rating >= 4 ? 'success' : dto.rating <= 2 ? 'error' : 'info',
        '/feedback/reviews',
        {
          stat: { label: 'Rating', value: `${dto.rating}/5` },
          footnote: author,
          cta: 'Read Review',
        },
        // `type` above is the tone, which changes with the star count; this is
        // the stable event identity the batching key and the merged copy are
        // built on, so five ratings in a rush collapse into one row.
        'new_rating',
      )
      .catch((err) =>
        this.logger.error(`Failed to notify staff of feedback: ${err.message}`),
      );

    return saved;
  }

  async getStats(branchId?: string) {
    try {
      const query = this.feedbackRepository.createQueryBuilder('f');
      if (branchId) {
        query.where('f.branchId = :branchId OR f.branchId IS NULL', {
          branchId,
        });
      }

      const reviews = await query.getMany();
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return {
          totalReviews: 0,
          avgRating: 0,
          positive: 0,
          negative: 0,
        };
      }

      const totalScore = reviews.reduce(
        (acc, curr) => acc + (curr.rating || 0),
        0,
      );
      const avgRating = Number((totalScore / totalReviews).toFixed(1));

      const positiveCount = reviews.filter(
        (r) => (r.rating && r.rating >= 4) || r.sentiment === 'positive',
      ).length;
      const negativeCount = reviews.filter(
        (r) => (r.rating && r.rating <= 2) || r.sentiment === 'negative',
      ).length;

      const positive = Math.round((positiveCount / totalReviews) * 100);
      const negative = Math.round((negativeCount / totalReviews) * 100);

      return {
        totalReviews,
        avgRating,
        positive,
        negative,
      };
    } catch (err) {
      this.logger.error(`Error calculating feedback stats: ${err.message}`);
      return {
        totalReviews: 0,
        avgRating: 0,
        positive: 0,
        negative: 0,
      };
    }
  }

  async getReviews(branchId?: string) {
    try {
      const query = this.feedbackRepository.createQueryBuilder('f');
      if (branchId) {
        query.where('f.branchId = :branchId OR f.branchId IS NULL', {
          branchId,
        });
      }
      query.orderBy('f.createdAt', 'DESC');

      const list = await query.getMany();

      return list.map((item) => ({
        id: item.id,
        user: item.customerName || 'Anonymous Customer',
        rating: item.rating ?? 5,
        comment: item.comment || '',
        date: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Recently',
        status: item.status || 'new',
        sentiment: item.sentiment || 'positive',
      }));
    } catch (err) {
      this.logger.error(`Error fetching feedback reviews: ${err.message}`);
      return [];
    }
  }
}
