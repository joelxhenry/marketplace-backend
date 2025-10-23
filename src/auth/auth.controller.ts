import { Controller, Get, Post, UseGuards, Req, Res, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  AppleAuthDto,
  AuthResponseDto,
  RefreshTokenDto,
  AuthUserResponseDto
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects user to Google OAuth consent screen',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth',
  })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles Google OAuth callback and creates/authenticates user',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with JWT token',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { user, accessToken } = await this.authService.googleLogin(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  // Apple OAuth routes
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({
    summary: 'Initiate Apple Sign In flow',
    description: 'Redirects user to Apple Sign In authentication',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Apple Sign In',
  })
  async appleAuth() {
    // Initiates Apple OAuth flow
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({
    summary: 'Apple Sign In callback',
    description: 'Handles Apple Sign In callback and creates/authenticates user',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with JWT token',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  async appleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { id, email, firstName, lastName } = req.user;
    const { user, accessToken } = await this.authService.appleLogin(
      id,
      email,
      firstName,
      lastName,
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  // Get current user profile
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: AuthUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getCurrentUser(@Req() req: any) {
    return req.user;
  }

  // Logout endpoint
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout endpoint (JWT is stateless, token removal handled client-side)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async logout(@Req() req: any) {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // This endpoint can be used for logging/analytics
    return { message: 'Logged out successfully' };
  }

  // Password-based authentication routes

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error or email already exists',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already registered',
  })
  async register(@Body() registerDto: RegisterDto) {
    const { user, accessToken, refreshToken } = await this.authService.register(registerDto);
    return {
      accessToken,
      refreshToken,
      user,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async login(@Body() loginDto: LoginDto) {
    const { user, accessToken, refreshToken } = await this.authService.login(loginDto);
    return {
      accessToken,
      refreshToken,
      user,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  // Token refresh endpoint
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const { user, accessToken, refreshToken } = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return {
      accessToken,
      refreshToken,
      user,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }
}
