import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { CookieOptions, Response as ExpressResponse } from 'express';
import { Inject } from '@nestjs/common';

import { DATABASE_CONNECTION } from '../database/database-connection';
import type { DrizzleDatabase } from '../database/merged-schemas';
import { verificationTokens, type User } from '../database/schemas/users';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: DrizzleDatabase,
  ) {}

  private async generateTokens(payload: TokenPayload) {
    const accessOptions: JwtSignOptions = {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: Math.floor(this.accessTokenMs() / 1000),
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: Math.floor(this.refreshTokenMs() / 1000),
    };

    return {
      accessToken: this.jwtService.sign({ ...payload }, accessOptions),
      refreshToken: this.jwtService.sign({ ...payload }, refreshOptions),
    };
  }

  private accessTokenMs() {
    return parseInt(
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
      10,
    );
  }

  private refreshTokenMs() {
    return parseInt(
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
      10,
    );
  }

  private cookieOptions(maxAgeMs: number): CookieOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: this.configService.get('COOKIE_DOMAIN') || undefined,
      path: '/',
      expires: new Date(Date.now() + maxAgeMs),
    };
  }

  private setAuthCookies(
    response: ExpressResponse,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    response.cookie(
      'Authentication',
      tokens.accessToken,
      this.cookieOptions(this.accessTokenMs()),
    );
    response.cookie(
      'Refresh',
      tokens.refreshToken,
      this.cookieOptions(this.refreshTokenMs()),
    );
  }

  private clearAuthCookies(response: ExpressResponse) {
    const base = { ...this.cookieOptions(0), expires: new Date(0) };
    response.cookie('Authentication', '', base);
    response.cookie('Refresh', '', base);
  }

  async issueSession(user: User, response: ExpressResponse) {
    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
    });

    await this.usersService.setRefreshToken(
      user.id,
      await hash(tokens.refreshToken, 10),
    );
    this.setAuthCookies(response, tokens);

    return tokens;
  }

  async logout(user: User, response: ExpressResponse) {
    await this.usersService.setRefreshToken(user.id, null);
    this.clearAuthCookies(response);
  }

  async verifyUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    const stored =
      user?.password ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinva';
    const matches = await compare(password, stored);

    if (!user || !user.password || !matches) {
      throw new UnauthorizedException('Incorrect email or password.');
    }

    return user;
  }

  async verifyRefreshToken(token: string, userId: number): Promise<User> {
    const user = await this.usersService.findById(userId);

    if (!user.refreshToken || !(await compare(token, user.refreshToken))) {
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    return user;
  }

  async register(dto: CreateUserDto, response: ExpressResponse) {
    const user = await this.usersService.createUser(dto);
    await this.sendVerificationEmail(user);
    await this.issueSession(user, response);
    return user;
  }

  async loginWithProvider(
    profile: { email: string; name: string },
    response: ExpressResponse,
  ) {
    const user = await this.usersService.findOrCreateOAuthUser(profile);
    await this.issueSession(user, response);
    return user;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createToken(
    userId: number,
    purpose: 'email_verification' | 'password_reset',
    ttlMs: number,
  ) {
    const token = randomBytes(32).toString('hex');

    await this.database.insert(verificationTokens).values({
      userId,
      tokenHash: this.hashToken(token),
      purpose,
      expiresAt: new Date(Date.now() + ttlMs),
    });

    return token;
  }

  async sendVerificationEmail(user: User) {
    const token = await this.createToken(
      user.id,
      'email_verification',
      24 * 60 * 60 * 1000,
    );
    const url = `${this.configService.getOrThrow('WEB_APP_URL')}/verify-email?token=${token}`;

    await this.emailService.send({
      to: user.email,
      template: 'magic-link',
      props: { name: user.name, url, purpose: 'verify' },
      relatedType: 'user',
      relatedId: user.id,
    });
  }

  private async consumeToken(
    token: string,
    purpose: 'email_verification' | 'password_reset',
  ) {
    const [row] = await this.database
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, this.hashToken(token)),
          eq(verificationTokens.purpose, purpose),
          isNull(verificationTokens.consumedAt),
          gt(verificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException('That link is invalid or has expired.');
    }

    await this.database
      .update(verificationTokens)
      .set({ consumedAt: new Date() })
      .where(eq(verificationTokens.id, row.id));

    return this.usersService.findById(row.userId);
  }

  async verifyEmail(token: string) {
    const user = await this.consumeToken(token, 'email_verification');
    await this.usersService.markEmailVerified(user.id);
    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) return;

    const token = await this.createToken(
      user.id,
      'password_reset',
      60 * 60 * 1000,
    );
    const url = `${this.configService.getOrThrow('WEB_APP_URL')}/reset-password?token=${token}`;

    await this.emailService.send({
      to: user.email,
      template: 'magic-link',
      props: { name: user.name, url, purpose: 'reset' },
      relatedType: 'user',
      relatedId: user.id,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.consumeToken(token, 'password_reset');
    await this.usersService.setPassword(user.id, newPassword);
    return user;
  }
}
