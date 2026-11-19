import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  @ApiPropertyOptional({ example: 'ar' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  preferredLanguageCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceLabel?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceLabel?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (or stub.<subject> in tests)' })
  @IsString()
  @MinLength(10)
  idToken!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceLabel?: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: '+966501234567' })
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phoneE164!: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  purpose?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+966501234567' })
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  phoneE164!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code!: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  deviceLabel?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  displayName?: string;

  @ApiPropertyOptional({ example: 'ar' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  preferredLanguageCode?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  countryId?: string | null;
}
