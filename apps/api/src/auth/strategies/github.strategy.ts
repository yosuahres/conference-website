import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

import { UsersService } from '../../users/users.service';

interface OAuthProfile {
  displayName?: string;
  username?: string;
  emails?: { value: string; verified?: boolean }[];
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
    // GitHub's /user/emails returns every address on the account, verified or
    // not, and passport hands them over in that order. Pick a verified one
    // rather than whichever happens to be first.
    const verified = await this.fetchVerifiedEmail(_accessToken);
    if (!verified) {
      throw new Error(
        'No verified email address on this GitHub account. Verify one on GitHub and try again.',
      );
    }

    return this.usersService.findOrCreateOAuthUser({
      email: verified,
      name: profile.displayName || profile.username || verified,
      emailVerified: true,
    });
  }

  /**
   * The scope grants /user/emails, which is the only place GitHub states
   * whether an address is verified. The profile object does not carry it.
   */
  private async fetchVerifiedEmail(accessToken: string) {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'conference-api',
      },
    });

    if (!response.ok) return null;

    const emails = (await response.json()) as {
      email: string;
      primary: boolean;
      verified: boolean;
    }[];

    const usable = emails.filter((entry) => entry.verified);
    return (usable.find((entry) => entry.primary) ?? usable[0])?.email ?? null;
  }
}
