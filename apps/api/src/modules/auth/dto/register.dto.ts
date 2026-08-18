import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  // Business details — optional at registration, captured during onboarding
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  branchAddress?: string;

  @IsString()
  @IsOptional()
  branchCity?: string;
}
