import { Controller, Get, Post, UseGuards, Req, Res, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google OAuth routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { user, accessToken } = await this.authService.googleLogin(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  // Apple OAuth routes
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    // Initiates Apple OAuth flow
  }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
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
  async getCurrentUser(@Req() req: any) {
    return req.user;
  }

  // Logout endpoint
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any) {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // This endpoint can be used for logging/analytics
    return { message: 'Logged out successfully' };
  }

  // Password-based authentication routes

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const { user, accessToken } = await this.authService.register(registerDto);
    return {
      message: 'Registration successful',
      user,
      accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { user, accessToken } = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      user,
      accessToken,
    };
  }
}
