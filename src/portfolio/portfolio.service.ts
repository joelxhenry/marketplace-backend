import { Injectable } from '@nestjs/common';
import { PortfolioItemType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: DatabaseService) {}

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
    const regex = /(?:vimeo\.com\/)(?:.*#|.*/videos/)?([0-9]+)/i;
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
