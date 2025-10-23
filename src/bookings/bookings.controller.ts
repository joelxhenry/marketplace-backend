import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
  GetBookingsQueryDto,
  BookingResponseDto,
  AssignBookingDto,
  GetGuestBookingsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new booking',
    description:
      'Create a new booking for a service. Either customerId (for registered users) or guestInfo (for guest bookings) must be provided. Automatically calculates pricing with 12.5% GCT (Jamaica General Consumption Tax).',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking data or validation errors',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Either customerId or guestInfo must be provided' },
            {
              type: 'array',
              items: { type: 'string' },
              example: ['startTime must be a valid ISO 8601 date string'],
            },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user bookings',
    description:
      'Retrieve all bookings for the authenticated user with optional filters for status and date range. Returns paginated results.',
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        bookings: {
          type: 'array',
          items: { $ref: '#/components/schemas/BookingResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 45 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async getUserBookings(@Request() req, @Query() dto: GetBookingsQueryDto) {
    return this.bookingsService.getUserBookings(req.user.userId, dto);
  }

  @Get('guest')
  @ApiOperation({
    summary: 'Get guest bookings by email',
    description:
      'Retrieve all bookings made as a guest using the provided email address.',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Email is required' })
  async getGuestBookings(@Query() dto: GetGuestBookingsDto) {
    return this.bookingsService.getGuestBookingsByEmail(dto.email);
  }

  @Get('provider/:providerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get provider bookings',
    description:
      'Retrieve all bookings for a specific provider. Accessible by provider team members. Non-owners without canManageBookings permission will only see their assigned bookings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider bookings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        bookings: {
          type: 'array',
          items: { $ref: '#/components/schemas/BookingResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 85 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Access denied to provider bookings' })
  async getProviderBookings(
    @Param('providerId') providerId: string,
    @Request() req,
    @Query() dto: GetBookingsQueryDto,
  ) {
    return this.bookingsService.getProviderBookingsPaginated(
      providerId,
      req.user.userId,
      dto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description:
      'Retrieve detailed information about a specific booking. For guest bookings, email verification may be required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiForbiddenResponse({ description: 'Access denied to this booking' })
  async getBookingById(
    @Param('id') id: string,
    @Query('email') email?: string,
  ) {
    return this.bookingsService.getBookingById(id, email);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a booking',
    description:
      'Update booking details such as time, notes, or assigned user. Customers can only update PENDING or CONFIRMED bookings. Provider team members with appropriate permissions can update any booking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this booking',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiBadRequestResponse({
    description: 'Cannot update booking in current status',
  })
  async updateBooking(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update booking status',
    description:
      'Update the status of a booking (e.g., PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED). Only accessible by provider owners or team members with canManageBookings permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
    type: BookingResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update booking status',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(id, req.user.userId, dto);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign booking to a team member',
    description:
      'Assign a booking to a specific team member. Only accessible by provider owners or team members with canManageBookings permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking assigned successfully',
    type: BookingResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to assign bookings',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiBadRequestResponse({
    description: 'User is not part of this provider',
  })
  async assignBooking(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: AssignBookingDto,
  ) {
    return this.bookingsService.assignBookingToUser(
      id,
      dto.assignedUserId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Cancel a booking. Can be performed by the customer who created the booking or by provider team members. Cannot cancel bookings that are already COMPLETED or CANCELLED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: BookingResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to cancel this booking',
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @ApiBadRequestResponse({
    description: 'Cannot cancel booking in current status',
  })
  async cancelBooking(@Param('id') id: string, @Request() req) {
    return this.bookingsService.cancelBooking(id, req.user.userId);
  }
}
