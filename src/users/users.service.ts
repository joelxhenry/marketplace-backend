import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto, UpdateUserDto, AdminUpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create a new user (Admin only)
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName, phone, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: role || 'CUSTOMER',
        isEmailVerified: false,
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users with pagination (Admin only)
   */
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isEmailVerified: true,
          googleId: true,
          appleId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        googleId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Get user by ID with provider information
   */
  async findOneWithProviders(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        googleId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Transform providerUsers to simpler format
    const { providerUsers, ...userData } = user;
    const providers = providerUsers.map(pu => ({
      id: pu.provider.id,
      businessName: pu.provider.businessName,
      isOwner: pu.isOwner,
      title: pu.title || (pu.isOwner ? 'Owner' : 'Team Member'),
    }));

    return {
      ...userData,
      providers,
    };
  }

  /**
   * Update user (self or admin)
   */
  async update(id: string, updateUserDto: UpdateUserDto | AdminUpdateUserDto, isAdmin: boolean = false) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If email is being updated, check if it's already taken
    if ('email' in updateUserDto && updateUserDto.email && updateUserDto.email !== existingUser.email) {
      if (!isAdmin) {
        throw new ForbiddenException('Only admins can change email addresses');
      }

      const emailTaken = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailTaken) {
        throw new ConflictException('Email address is already in use');
      }
    }

    // If role is being updated, ensure only admins can do it
    if ('role' in updateUserDto && updateUserDto.role && !isAdmin) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        googleId: true,
        appleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Delete user (Admin only)
   */
  async remove(id: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete user (cascade deletes will handle related records)
    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: `User ${user.email} has been deleted`,
    };
  }
}
