import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsInt()
  @IsPositive()
  tierId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  submissionId?: number | null;

  @IsIn(['onsite', 'online'])
  mode: 'onsite' | 'online';

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  affiliation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  dietaryNotes?: string;

  @IsBoolean()
  needsVisaLetter: boolean;
}
