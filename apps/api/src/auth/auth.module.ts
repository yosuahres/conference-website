import { Logger, Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

function optionalOAuthProviders(): Provider[] {
  const logger = new Logger('AuthModule');
  const providers: Provider[] = [];

  if (process.env.GOOGLE_AUTH_CLIENT_ID) {
    if (
      process.env.GOOGLE_AUTH_CLIENT_SECRET &&
      process.env.GOOGLE_AUTH_REDIRECT_URI
    ) {
      providers.push(GoogleStrategy);
    } else {
      logger.warn(
        'GOOGLE_AUTH_CLIENT_ID is set but the secret or redirect URI is missing, so Google sign-in is disabled.',
      );
    }
  }

  if (process.env.GITHUB_AUTH_CLIENT_ID) {
    if (
      process.env.GITHUB_AUTH_CLIENT_SECRET &&
      process.env.GITHUB_AUTH_REDIRECT_URI
    ) {
      providers.push(GithubStrategy);
    } else {
      logger.warn(
        'GITHUB_AUTH_CLIENT_ID is set but the secret or redirect URI is missing, so GitHub sign-in is disabled.',
      );
    }
  }

  return providers;
}

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({}), ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    ...optionalOAuthProviders(),
  ],
  exports: [AuthService],
})
export class AuthModule {}
