import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  token: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters.' })
  @MaxLength(128)
  password: string;
}
