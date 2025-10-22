import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { DatabaseService } from '../database/database.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async googleLogin(profile: any) {
    const { email, firstName, lastName, picture } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // Create new user from Google profile
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatar: picture,
          googleId: profile.id,
          isEmailVerified: true,
        },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    } else if (!user.googleId) {
      // Link existing account to Google
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    return { user, accessToken, refreshToken };
  }

  async appleLogin(appleId: string, email: string, firstName?: string, lastName?: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { appleId },
          { email },
        ],
      },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // Create new user from Apple ID
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: firstName || 'Apple',
          lastName: lastName || 'User',
          appleId,
          isEmailVerified: true,
        },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    } else if (!user.appleId) {
      // Link existing account to Apple
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { appleId },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    return { user, accessToken, refreshToken };
  }

  // Password-based authentication methods

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

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
        role: UserRole.CUSTOMER,
        isEmailVerified: false, // Require email verification for password signup
      },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.passwordHash) {
      throw new BadRequestException('This account uses OAuth authentication. Please sign in with Google or Apple.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(token);

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        providers: user.providerUsers.map(pu => ({
          id: pu.provider.id,
          name: pu.provider.businessName,
          isOwner: pu.isOwner,
        }))
      };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Remove password hash from user object
    const { passwordHash: _, ...result } = user;
    return result;
  }

  private generateJwtPayload(user: any) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      providers: user.providerUsers?.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      })) || []
    };
  }
}
