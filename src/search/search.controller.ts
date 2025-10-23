import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchProvidersDto,
  SearchProvidersResponseDto,
} from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('providers')
  @ApiOperation({
    summary: 'Search for service providers',
    description:
      'Search for verified service providers with flexible filters including text search, location-based search, category, rating, and price filters. Returns paginated results with provider details, services, portfolio items, and team members.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: SearchProvidersResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['latitude must be between -90 and 90'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async searchProviders(
    @Query() dto: SearchProvidersDto,
  ): Promise<SearchProvidersResponseDto> {
    return this.searchService.search(dto);
  }
}
