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
import { ServicesService } from './services.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceResponseDto,
  ServiceWithProviderResponseDto,
} from './dto/service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create service',
    description: 'Create a new service for a provider. Requires owner or service management permissions.',
  })
  @ApiQuery({
    name: 'providerId',
    description: 'Provider ID',
    required: true,
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
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
    @Body() createServiceDto: CreateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.create(providerId, createServiceDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'List all services',
    description: 'Get paginated list of all services with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
    example: 'Hair',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiPaginatedResponse(ServiceWithProviderResponseDto)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (category) {
      filters.category = category;
    }
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return this.servicesService.findAll(paginationDto, filters);
  }

  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Get provider services',
    description: 'Get all services for a specific provider',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    type: [ServiceResponseDto],
  })
  async findByProvider(@Param('providerId') providerId: string) {
    return this.servicesService.findByProvider(providerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Get detailed service information including provider details and add-ons',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Service found',
    type: ServiceWithProviderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update service',
    description: 'Update service information. Requires owner or service management permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
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
    description: 'Service not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.update(id, updateServiceDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete service',
    description: 'Delete a service. Requires owner or service management permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Service "Classic Haircut" has been deleted' },
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
    description: 'Service not found',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.remove(id, req.user.sub);
  }
}
