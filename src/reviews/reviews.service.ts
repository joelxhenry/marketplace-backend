import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RespondReviewDto } from './dto/respond-review.dto';
import { ReviewQueryDto, ReviewSortBy } from './dto/review-query.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseService) {}

  // Create a review
  async create(customerId: string, createReviewDto: CreateReviewDto) {
    const { bookingId, rating, comment, photos } = createReviewDto;

    // Verify booking exists and belongs to customer
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException(
        'You can only review completed bookings',
      );
    }

    if (booking.review) {
      throw new BadRequestException(
        'This booking has already been reviewed',
      );
    }

    // Create review
    const review = await this.db.review.create({
      data: {
        bookingId,
        customerId,
        providerId: booking.providerId,
        rating,
        comment,
        photos: photos || [],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Update provider statistics
    await this.updateProviderStats(booking.providerId);

    return review;
  }

  // Get all reviews with filters
  async findAll(query: ReviewQueryDto) {
    const {
      page = 1,
      limit = 10,
      providerId,
      customerId,
      minRating,
      maxRating,
      isApproved,
      sortBy = ReviewSortBy.NEWEST,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (providerId) where.providerId = providerId;
    if (customerId) where.customerId = customerId;
    if (isApproved !== undefined) where.isApproved = isApproved;
    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating) where.rating.gte = minRating;
      if (maxRating) where.rating.lte = maxRating;
    }

    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case ReviewSortBy.NEWEST:
        orderBy = { createdAt: 'desc' };
        break;
      case ReviewSortBy.OLDEST:
        orderBy = { createdAt: 'asc' };
        break;
      case ReviewSortBy.HIGHEST_RATING:
        orderBy = { rating: 'desc' };
        break;
      case ReviewSortBy.LOWEST_RATING:
        orderBy = { rating: 'asc' };
        break;
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      this.db.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          provider: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
            },
          },
        },
      }),
      this.db.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single review
  async findOne(id: string) {
    const review = await this.db.review.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  // Update review (customer only)
  async update(
    id: string,
    customerId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.db.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.db.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Update provider statistics if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProviderStats(review.providerId);
    }

    return updated;
  }

  // Provider responds to review
  async respond(id: string, providerId: string, respondDto: RespondReviewDto) {
    const review = await this.db.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.providerId !== providerId) {
      throw new ForbiddenException(
        'You can only respond to reviews for your business',
      );
    }

    return await this.db.review.update({
      where: { id },
      data: {
        response: respondDto.response,
        respondedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });
  }

  // Delete review (customer only)
  async remove(id: string, customerId: string) {
    const review = await this.db.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.db.review.delete({
      where: { id },
    });

    // Update provider statistics
    await this.updateProviderStats(review.providerId);

    return { message: 'Review deleted successfully' };
  }

  // Flag review (for moderation)
  async flag(id: string) {
    const review = await this.db.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return await this.db.review.update({
      where: { id },
      data: { isFlagged: true },
    });
  }

  // Admin: Approve/reject review
  async moderate(id: string, isApproved: boolean) {
    const review = await this.db.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.db.review.update({
      where: { id },
      data: { isApproved, isFlagged: false },
    });

    // Update provider statistics
    await this.updateProviderStats(review.providerId);

    return updated;
  }

  // Get provider review statistics
  async getProviderStats(providerId: string) {
    const [reviews, ratingDistribution] = await Promise.all([
      this.db.review.findMany({
        where: {
          providerId,
          isApproved: true,
        },
        select: { rating: true },
      }),
      this.db.review.groupBy({
        by: ['rating'],
        where: {
          providerId,
          isApproved: true,
        },
        _count: { rating: true },
      }),
    ]);

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : null;

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item.rating] = item._count.rating;
    });

    return {
      totalReviews,
      averageRating: averageRating ? Number(averageRating.toFixed(2)) : null,
      distribution,
    };
  }

  // Private: Update provider statistics
  private async updateProviderStats(providerId: string) {
    const stats = await this.getProviderStats(providerId);

    await this.db.provider.update({
      where: { id: providerId },
      data: {
        averageRating: stats.averageRating,
        reviewCount: stats.totalReviews,
      },
    });
  }
}
