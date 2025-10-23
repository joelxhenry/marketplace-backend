import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
  PortfolioItemResponseDto,
  PortfolioItemWithProviderResponseDto,
} from './dto/portfolio.dto';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create portfolio item',
    description: 'Create a new portfolio item for a provider. Requires owner or service management permissions.',
  })
  @ApiQuery({
    name: 'providerId',
    description: 'Provider ID',
    required: true,
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: CreatePortfolioItemDto })
  @ApiResponse({
    status: 201,
    description: 'Portfolio item created successfully',
    type: PortfolioItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or missing required fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or service management permissions',
  })
  async create(
    @Query('providerId') providerId: string,
    @Body() createPortfolioItemDto: CreatePortfolioItemDto,
    @Req() req: any,
  ) {
    return this.portfolioService.create(providerId, createPortfolioItemDto, req.user.sub);
  }

  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Get provider portfolio',
    description: 'Get all portfolio items for a specific provider with optional filters',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
    example: 'Weddings',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    type: Boolean,
    description: 'Filter by featured status',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio items retrieved successfully',
    type: [PortfolioItemResponseDto],
  })
  async findByProvider(
    @Param('providerId') providerId: string,
    @Query('category') category?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const filters: any = {};
    if (category) {
      filters.category = category;
    }
    if (isFeatured !== undefined) {
      filters.isFeatured = isFeatured === 'true';
    }

    return this.portfolioService.getProviderPortfolio(providerId, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get portfolio item by ID',
    description: 'Get detailed portfolio item information including provider details',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio item ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio item found',
    type: PortfolioItemWithProviderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async findOne(@Param('id') id: string) {
    return this.portfolioService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update portfolio item',
    description: 'Update portfolio item information. Requires owner or service management permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio item ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: UpdatePortfolioItemDto })
  @ApiResponse({
    status: 200,
    description: 'Portfolio item updated successfully',
    type: PortfolioItemResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or service management permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePortfolioItemDto: UpdatePortfolioItemDto,
    @Req() req: any,
  ) {
    return this.portfolioService.update(id, updatePortfolioItemDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete portfolio item',
    description: 'Delete a portfolio item. Requires owner or service management permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio item ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio item deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Portfolio item "Modern Wedding Photography" has been deleted' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or service management permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio item not found',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.remove(id, req.user.sub);
  }
}
