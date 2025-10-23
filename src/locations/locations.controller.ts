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
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationResponseDto,
  SearchNearbyDto,
  AddLocationToProviderDto,
  UpdateProviderLocationDto,
  ProviderLocationResponseDto,
} from './dto/location.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create location',
    description: 'Create a new location',
  })
  @ApiBody({ type: CreateLocationDto })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Post('search/nearby')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search nearby locations',
    description: 'Find locations within a specified radius from coordinates',
  })
  @ApiBody({ type: SearchNearbyDto })
  @ApiResponse({
    status: 200,
    description: 'Nearby locations retrieved successfully',
    type: [LocationResponseDto],
  })
  async searchNearby(@Body() searchNearbyDto: SearchNearbyDto) {
    return this.locationsService.findNearbyLocations(
      searchNearbyDto.latitude,
      searchNearbyDto.longitude,
      searchNearbyDto.radius || 10,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List all locations',
    description: 'Get paginated list of all locations',
  })
  @ApiPaginatedResponse(LocationResponseDto)
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.locationsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get location by ID',
    description: 'Get detailed location information including providers at this location',
  })
  @ApiParam({
    name: 'id',
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Location found',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update location',
    description: 'Update location information',
  })
  @ApiParam({
    name: 'id',
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete location (Admin only)',
    description: 'Delete a location. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Location deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Location "Kingston Downtown Office" has been deleted' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires ADMIN role',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete locations');
    }

    return this.locationsService.remove(id);
  }

  // Provider Location Management Endpoints

  @Post('providers/:providerId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add location to provider',
    description: 'Link an existing location to a provider. Requires owner or location management permissions.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: AddLocationToProviderDto })
  @ApiResponse({
    status: 201,
    description: 'Location added to provider successfully',
    type: ProviderLocationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or location management permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider or location not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Location already linked to provider',
  })
  async addLocationToProvider(
    @Param('providerId') providerId: string,
    @Body() addLocationDto: AddLocationToProviderDto,
    @Req() req: any,
  ) {
    return this.locationsService.addLocationToProvider(providerId, addLocationDto, req.user.sub);
  }

  @Get('providers/:providerId')
  @ApiOperation({
    summary: 'Get provider locations',
    description: 'Get all locations for a specific provider',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider locations retrieved successfully',
    type: [ProviderLocationResponseDto],
  })
  async getProviderLocations(@Param('providerId') providerId: string) {
    return this.locationsService.getProviderLocations(providerId);
  }

  @Patch('providers/:providerId/:locationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update provider location settings',
    description: 'Update settings for a specific provider location (e.g., set as primary)',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiParam({
    name: 'locationId',
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: UpdateProviderLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Provider location updated successfully',
    type: ProviderLocationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or location management permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider location not found',
  })
  async updateProviderLocation(
    @Param('providerId') providerId: string,
    @Param('locationId') locationId: string,
    @Body() updateDto: UpdateProviderLocationDto,
    @Req() req: any,
  ) {
    return this.locationsService.updateProviderLocation(providerId, locationId, updateDto, req.user.sub);
  }

  @Delete('providers/:providerId/:locationId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove location from provider',
    description: 'Unlink a location from a provider. Requires owner or location management permissions.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiParam({
    name: 'locationId',
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Location removed from provider successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Location removed from provider successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or location management permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider location not found',
  })
  async removeLocationFromProvider(
    @Param('providerId') providerId: string,
    @Param('locationId') locationId: string,
    @Req() req: any,
  ) {
    return this.locationsService.removeLocationFromProvider(providerId, locationId, req.user.sub);
  }
}
