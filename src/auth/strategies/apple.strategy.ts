import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    const privateKeyPath = configService.get('oauth.apple.privateKeyPath') || './certs/apple-private-key.p8';
    let privateKey = 'dummy-key'; // Default value for when key file doesn't exist

    try {
      privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');
    } catch (error) {
      console.warn('Apple private key not found, using dummy key');
    }

    super({
      clientID: configService.get('oauth.apple.clientId') || '',
      teamID: configService.get('oauth.apple.teamId') || '',
      keyID: configService.get('oauth.apple.keyId') || '',
      privateKey,
      callbackURL: `${configService.get('app.url')}/auth/apple/callback`,
      scope: ['name', 'email'],
    } as any); // Type assertion to bypass strict typing
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
  ) {
    return {
      id: idToken.sub,
      email: idToken.email,
      firstName: profile.name?.firstName,
      lastName: profile.name?.lastName,
      accessToken,
    };
  }
}
