import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto, GuestInfoDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    // Validate that either customerId or guestInfo is provided
    if (!dto.customerId && !dto.guestInfo) {
      throw new BadRequestException('Either customerId or guestInfo must be provided');
    }

    if (dto.customerId && dto.guestInfo) {
      throw new BadRequestException('Cannot provide both customerId and guestInfo');
    }

    const isGuestBooking = !!dto.guestInfo;

    // If customerId is provided, validate the customer exists
    if (dto.customerId) {
      const customer = await this.prisma.user.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
    }

    // Validate location belongs to provider
    const providerLocation = await this.prisma.providerLocation.findFirst({
      where: {
        providerId: dto.providerId,
        locationId: dto.locationId,
        isActive: true,
      },
    });

    if (!providerLocation) {
      throw new BadRequestException('Invalid location for this provider');
    }

    // Validate assigned user belongs to provider (if specified)
    if (dto.assignedUserId) {
      const providerUser = await this.prisma.providerUser.findFirst({
        where: {
          providerId: dto.providerId,
          userId: dto.assignedUserId,
          isActive: true,
        },
      });

      if (!providerUser) {
        throw new BadRequestException('Invalid assigned user for this provider');
      }
    }

    // Validate provider user assignment (if specified)
    if (dto.providerUserId) {
      const providerUser = await this.prisma.providerUser.findUnique({
        where: { id: dto.providerUserId },
      });

      if (!providerUser || providerUser.providerId !== dto.providerId) {
        throw new BadRequestException('Invalid provider user for this provider');
      }
    }

    // Get services and calculate pricing
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: dto.serviceIds },
        providerId: dto.providerId,
        isActive: true,
      },
    });

    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException('Some services are invalid');
    }

    const subtotal = services.reduce((sum, service) => sum + Number(service.basePrice), 0);
    const taxAmount = subtotal * 0.125; // 12.5% GCT in Jamaica
    const totalAmount = subtotal + taxAmount;

    // Create booking in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          ...(dto.customerId && { customerId: dto.customerId }),
          providerId: dto.providerId,
          ...(dto.assignedUserId && { assignedUserId: dto.assignedUserId }),
          ...(dto.providerUserId && { providerUserId: dto.providerUserId }),
          locationId: dto.locationId,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          subtotal,
          taxAmount,
          totalAmount,
          ...(dto.customerNotes && { customerNotes: dto.customerNotes }),
          status: BookingStatus.PENDING,
          // Guest booking fields
          isGuestBooking,
          ...(dto.guestInfo?.firstName && { guestFirstName: dto.guestInfo.firstName }),
          ...(dto.guestInfo?.lastName && { guestLastName: dto.guestInfo.lastName }),
          ...(dto.guestInfo?.email && { guestEmail: dto.guestInfo.email }),
          ...(dto.guestInfo?.phone && { guestPhone: dto.guestInfo.phone }),
        },
      });

      // Create booking items
      const bookingItems = await Promise.all(
        services.map(service =>
          tx.bookingItem.create({
            data: {
              bookingId: newBooking.id,
              serviceId: service.id,
              unitPrice: service.basePrice,
              total: service.basePrice,
            },
          })
        )
      );

      return { ...newBooking, items: bookingItems };
    });

    // Send notifications
    await this.notificationsService.sendBookingConfirmation(booking.id);

    return booking;
  }

  async assignBookingToUser(
    bookingId: string,
    assignedUserId: string,
    requestingUserId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Check if requesting user has permission
    const requestingProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: booking.providerId,
        userId: requestingUserId,
        isActive: true,
      },
    });

    if (!requestingProviderUser?.canManageBookings && !requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Insufficient permissions to assign bookings');
    }

    // Validate assigned user belongs to provider
    const assignedProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: booking.providerId,
        userId: assignedUserId,
        isActive: true,
      },
    });

    if (!assignedProviderUser) {
      throw new BadRequestException('User is not part of this provider');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { assignedUserId },
      include: {
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getProviderBookings(
    providerId: string,
    userId?: string,
    filters?: {
      status?: BookingStatus;
      locationId?: string;
      assignedUserId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    // Check if user has access to provider bookings
    if (userId) {
      const providerUser = await this.prisma.providerUser.findFirst({
        where: {
          providerId,
          userId,
          isActive: true,
        },
      });

      if (!providerUser) {
        throw new ForbiddenException('Access denied');
      }

      // If user is not owner and can't manage bookings, only show their assigned bookings
      if (!providerUser.isOwner && !providerUser.canManageBookings) {
        filters = { ...filters, assignedUserId: userId };
      }
    }

    return this.prisma.booking.findMany({
      where: {
        providerId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.locationId && { locationId: filters.locationId }),
        ...(filters?.assignedUserId && { assignedUserId: filters.assignedUserId }),
        ...(filters?.startDate && { startTime: { gte: filters.startDate } }),
        ...(filters?.endDate && { endTime: { lte: filters.endDate } }),
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        location: true,
        items: {
          include: {
            service: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            gateway: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getGuestBookingsByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.prisma.booking.findMany({
      where: {
        isGuestBooking: true,
        guestEmail: email,
      },
      include: {
        provider: {
          select: {
            businessName: true,
            businessPhone: true,
            businessEmail: true,
            logoUrl: true,
          },
        },
        location: {
          select: {
            name: true,
            address: true,
            city: true,
            parish: true,
          },
        },
        items: {
          include: {
            service: {
              select: {
                name: true,
                duration: true,
                basePrice: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            gateway: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getBookingById(bookingId: string, email?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          select: {
            businessName: true,
            businessPhone: true,
            businessEmail: true,
            logoUrl: true,
          },
        },
        location: {
          select: {
            name: true,
            address: true,
            city: true,
            parish: true,
            latitude: true,
            longitude: true,
          },
        },
        items: {
          include: {
            service: {
              select: {
                name: true,
                description: true,
                duration: true,
                basePrice: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // If it's a guest booking and email is provided, verify the email matches
    if (booking.isGuestBooking && email) {
      if (booking.guestEmail !== email) {
        throw new ForbiddenException('Access denied');
      }
    }

    return booking;
  }
}
