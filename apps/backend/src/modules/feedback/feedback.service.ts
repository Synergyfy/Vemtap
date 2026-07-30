import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  private async ensureSeedData(branchId?: string) {
    try {
      const count = await this.feedbackRepository.count();
      if (count === 0) {
        const initialFeedback = [
          {
            branchId,
            customerName: 'Amina Bello',
            rating: 5,
            comment: 'Excellent service and super fast checkout with VemTap!',
            status: 'new',
            sentiment: 'positive',
          },
          {
            branchId,
            customerName: 'Chidi Okonkwo',
            rating: 5,
            comment:
              'Great experience using the digital menu and payment system.',
            status: 'replied',
            sentiment: 'positive',
          },
          {
            branchId,
            customerName: 'Tunde Bakare',
            rating: 4,
            comment: 'Very seamless flow, would love even more reward options.',
            status: 'new',
            sentiment: 'positive',
          },
          {
            branchId,
            customerName: 'Emem Udo',
            rating: 2,
            comment: 'Had a short wait time during peak hours.',
            status: 'flagged',
            sentiment: 'negative',
          },
        ];
        await this.feedbackRepository.save(initialFeedback);
      }
    } catch (err) {
      this.logger.warn(`Could not seed initial feedback data: ${err.message}`);
    }
  }

  async getStats(branchId?: string) {
    await this.ensureSeedData(branchId);

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
    await this.ensureSeedData(branchId);

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
