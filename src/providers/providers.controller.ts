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
  ApiQuery,
} from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderResponseDto,
  AddTeamMemberDto,
  TeamMemberResponseDto,
} from './dto/provider.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create provider',
    description: 'Create a new provider business. The creator becomes the owner.',
  })
  @ApiBody({ type: CreateProviderDto })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async create(@Body() createProviderDto: CreateProviderDto, @Req() req: any) {
    return this.providersService.create(createProviderDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'List all providers',
    description: 'Get paginated list of all providers with optional filters',
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
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiPaginatedResponse(ProviderResponseDto)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (isVerified !== undefined) {
      filters.isVerified = isVerified === 'true';
    }
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return this.providersService.findAll(paginationDto, filters);
  }

  @Get('my-providers')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my providers',
    description: 'Get all providers where the authenticated user is a team member',
  })
  @ApiResponse({
    status: 200,
    description: 'Providers retrieved successfully',
    type: [ProviderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async findMyProviders(@Req() req: any) {
    return this.providersService.findMyProviders(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get provider by ID',
    description: 'Get detailed provider information including team members, locations, and services',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider found',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update provider',
    description: 'Update provider information. Requires owner or authorized team member permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: UpdateProviderDto })
  @ApiResponse({
    status: 200,
    description: 'Provider updated successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires owner or authorized team member permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
    @Req() req: any,
  ) {
    return this.providersService.update(id, updateProviderDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete provider (Admin only)',
    description: 'Delete a provider business. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Provider "Elite Cleaning Services" has been deleted' },
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
    description: 'Provider not found',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete providers');
    }

    return this.providersService.remove(id);
  }

  // Team Management Endpoints

  @Post(':id/users')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add team member',
    description: 'Add a user to the provider team. Requires owner permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiBody({ type: AddTeamMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Team member added successfully',
    type: TeamMemberResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owners can add team members',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User is already a team member',
  })
  async addTeamMember(
    @Param('id') id: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
    @Req() req: any,
  ) {
    return this.providersService.addTeamMember(id, addTeamMemberDto, req.user.sub);
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Get team members',
    description: 'Get all team members for a provider',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Team members retrieved successfully',
    type: [TeamMemberResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async getTeamMembers(@Param('id') id: string) {
    return this.providersService.getTeamMembers(id);
  }

  @Delete(':id/users/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove team member',
    description: 'Remove a user from the provider team. Requires owner permissions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to remove',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @ApiResponse({
    status: 200,
    description: 'Team member removed successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Team member removed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owners can remove team members or cannot remove last owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider or team member not found',
  })
  async removeTeamMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.providersService.removeTeamMember(id, userId, req.user.sub);
  }
}
