import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    const privateKeyPath = configService.get('oauth.apple.privateKeyPath');
    const privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');

    super({
      clientID: configService.get('oauth.apple.clientId'),
      teamID: configService.get('oauth.apple.teamId'),
      keyID: configService.get('oauth.apple.keyId'),
      privateKey,
      callbackURL: `${configService.get('app.url')}/auth/apple/callback`,
      scope: ['name', 'email'],
    });
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
