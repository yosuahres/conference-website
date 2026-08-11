import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SubmissionAuthorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  affiliation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsBoolean()
  isCorresponding: boolean;
}

export class SaveSubmissionDto {
  @IsString()
  @MinLength(6)
  @MaxLength(300)
  title: string;

  @IsString()
  @MinLength(100, { message: 'Abstracts must be at least 100 characters.' })
  @MaxLength(5000)
  abstract: string;

  @IsArray()
  @ArrayMinSize(3, { message: 'Provide at least three keywords.' })
  @ArrayMaxSize(8)
  @IsString({ each: true })
  keywords: string[];

  @IsIn(['abstract', 'full_paper', 'poster'])
  type: 'abstract' | 'full_paper' | 'poster';

  @IsOptional()
  @IsInt()
  @IsPositive()
  trackId?: number | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => SubmissionAuthorDto)
  authors: SubmissionAuthorDto[];
}

export class RequestUploadDto {
  @IsIn(['manuscript', 'camera_ready', 'supplementary', 'copyright_form'])
  kind: 'manuscript' | 'camera_ready' | 'supplementary' | 'copyright_form';

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(160)
  contentType: string;

  @IsInt()
  @IsPositive()
  sizeBytes: number;
}

export class ConfirmUploadDto extends RequestUploadDto {
  @IsString()
  storageKey: string;

  @IsInt()
  @IsPositive()
  version: number;
}

export class ReviewDto {
  @IsInt()
  score: number;

  @IsIn(['accept', 'minor_revision', 'major_revision', 'reject'])
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';

  @IsString()
  @MinLength(20, { message: 'Please give the author some detail.' })
  commentsToAuthor: string;

  @IsOptional()
  @IsString()
  commentsToChair?: string;
}

export class DecisionDto {
  @IsIn(['accepted', 'rejected', 'revision_requested'])
  decision: 'accepted' | 'rejected' | 'revision_requested';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsBoolean()
  shareReviewerComments: boolean;
}

export class AssignReviewerDto {
  @IsInt()
  @IsPositive()
  reviewerId: number;

  @IsOptional()
  @IsString()
  dueAt?: string;
}
