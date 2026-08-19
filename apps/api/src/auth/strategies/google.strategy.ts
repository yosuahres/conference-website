import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

import { UsersService } from '../../users/users.service';

interface OAuthProfile {
  displayName: string;
  emails?: { value: string; verified?: boolean | string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_AUTH_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_AUTH_REDIRECT_URI'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: OAuthProfile,
  ) {
    const primary = profile.emails?.[0];
    if (!primary?.value)
      throw new Error('Google account has no email address.');

    // passport-google-oauth20 surfaces the verified flag as a boolean or the
    // string 'true' depending on the userinfo shape, so compare loosely.
    const emailVerified =
      primary.verified === true || primary.verified === 'true';

    return this.usersService.findOrCreateOAuthUser({
      email: primary.value,
      name: profile.displayName || primary.value,
      emailVerified,
    });
  }
}
