import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PortfolioItemType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create portfolio item with permission check
   */
  async create(providerId: string, createDto: CreatePortfolioItemDto, userId: string) {
    // Check if user has permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage portfolio for this provider');
    }

    // Extract video ID if video type
    let videoId: string | undefined;
    if ((createDto.type === PortfolioItemType.VIDEO_YOUTUBE || createDto.type === PortfolioItemType.VIDEO_VIMEO) && createDto.videoUrl) {
      videoId = this.extractVideoId(createDto.videoUrl);
    }

    // Validate URLs based on type
    if (createDto.type === PortfolioItemType.PHOTO && !createDto.imageUrl) {
      throw new BadRequestException('Image URL is required for photo portfolio items');
    }
    if ((createDto.type === PortfolioItemType.VIDEO_YOUTUBE || createDto.type === PortfolioItemType.VIDEO_VIMEO) && !createDto.videoUrl) {
      throw new BadRequestException('Video URL is required for video portfolio items');
    }

    return this.prisma.portfolioItem.create({
      data: {
        ...createDto,
        providerId,
        videoId,
        tags: createDto.tags || [],
      },
    });
  }

  /**
   * Get portfolio item by ID
   */
  async findOne(id: string) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Portfolio item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Update portfolio item with permission check
   */
  async update(id: string, updateDto: UpdatePortfolioItemDto, userId: string) {
    // Find the portfolio item
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id },
      select: { providerId: true, type: true },
    });

    if (!item) {
      throw new NotFoundException(`Portfolio item with ID ${id} not found`);
    }

    // Check if user has permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: item.providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage portfolio for this provider');
    }

    // Re-extract video ID if video URL is being updated
    let videoId: string | undefined;
    if (updateDto.videoUrl && (item.type === PortfolioItemType.VIDEO_YOUTUBE || item.type === PortfolioItemType.VIDEO_VIMEO)) {
      videoId = this.extractVideoId(updateDto.videoUrl);
    }

    return this.prisma.portfolioItem.update({
      where: { id },
      data: {
        ...updateDto,
        ...(videoId && { videoId }),
      },
    });
  }

  /**
   * Delete portfolio item with permission check
   */
  async remove(id: string, userId: string) {
    // Find the portfolio item
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id },
      select: { providerId: true, title: true },
    });

    if (!item) {
      throw new NotFoundException(`Portfolio item with ID ${id} not found`);
    }

    // Check if user has permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: item.providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage portfolio for this provider');
    }

    await this.prisma.portfolioItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Portfolio item "${item.title}" has been deleted`,
    };
  }

  /**
   * Extract video ID from URL (supports YouTube and Vimeo)
   */
  private extractVideoId(url: string): string | undefined {
    // Try YouTube first
    const youtubeId = this.extractYouTubeId(url);
    if (youtubeId) return youtubeId;

    // Try Vimeo
    const vimeoId = this.extractVimeoId(url);
    if (vimeoId) return vimeoId;

    return undefined;
  }

  async createPortfolioItem(data: {
    providerId: string;
    title: string;
    description?: string;
    type: PortfolioItemType;
    imageUrl?: string;
    videoUrl?: string;
    category: string;
    tags?: string[];
    isFeatured?: boolean;
  }) {
    let videoId: string | undefined;

    // Extract video ID for YouTube/Vimeo
    if (data.type === PortfolioItemType.VIDEO_YOUTUBE && data.videoUrl) {
      videoId = this.extractYouTubeId(data.videoUrl);
    } else if (data.type === PortfolioItemType.VIDEO_VIMEO && data.videoUrl) {
      videoId = this.extractVimeoId(data.videoUrl);
    }

    // Validate that the correct URL type is provided
    if (data.type === PortfolioItemType.PHOTO && !data.imageUrl) {
      throw new Error('Image URL is required for photo portfolio items');
    }
    if (data.type !== PortfolioItemType.PHOTO && !data.videoUrl) {
      throw new Error('Video URL is required for video portfolio items');
    }

    return this.prisma.portfolioItem.create({
      data: {
        ...data,
        videoId,
        tags: data.tags || [],
      },
    });
  }

  async getProviderPortfolio(
    providerId: string,
    filters?: {
      type?: PortfolioItemType;
      category?: string;
      isFeatured?: boolean;
    },
  ) {
    return this.prisma.portfolioItem.findMany({
      where: {
        providerId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async updatePortfolioItem(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      imageUrl: string;
      videoUrl: string;
      category: string;
      tags: string[];
      isFeatured: boolean;
      sortOrder: number;
    }>,
  ) {
    let videoId: string | undefined;

    // Re-extract video ID if video URL is being updated
    if (data.videoUrl) {
      const portfolioItem = await this.prisma.portfolioItem.findUnique({
        where: { id },
        select: { type: true },
      });

      if (portfolioItem?.type === PortfolioItemType.VIDEO_YOUTUBE) {
        videoId = this.extractYouTubeId(data.videoUrl);
      } else if (portfolioItem?.type === PortfolioItemType.VIDEO_VIMEO) {
        videoId = this.extractVimeoId(data.videoUrl);
      }
    }

    return this.prisma.portfolioItem.update({
      where: { id },
      data: {
        ...data,
        ...(videoId && { videoId }),
      },
    });
  }

  private extractYouTubeId(url: string): string | undefined {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  private extractVimeoId(url: string): string | undefined {
    const regex = new RegExp('(?:vimeo\\.com\\/)(?:.*#|.*\/videos\/)?([0-9]+)', 'i');
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  getVimeoEmbedUrl(videoId: string): string {
    return `https://player.vimeo.com/video/${videoId}`;
  }

  getVideoThumbnail(type: PortfolioItemType, videoId: string): string {
    if (type === PortfolioItemType.VIDEO_YOUTUBE) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } else if (type === PortfolioItemType.VIDEO_VIMEO) {
      // Vimeo requires API call for thumbnail, return placeholder for now
      return `https://vumbnail.com/${videoId}.jpg`;
    }
    return '';
  }
}
