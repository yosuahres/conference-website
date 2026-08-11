import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

import { UsersService } from '../../users/users.service';

interface OAuthProfile {
  displayName?: string;
  username?: string;
  emails?: { value: string }[];
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow('GITHUB_AUTH_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GITHUB_AUTH_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GITHUB_AUTH_REDIRECT_URI'),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: OAuthProfile,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('GitHub account has no public email address.');

    return this.usersService.findOrCreateOAuthUser({
      email,
      name: profile.displayName || profile.username || email,
    });
  }
}
