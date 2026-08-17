import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { BusinessType } from '@salesk/shared';

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
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  businessType!: BusinessType | string;

  @IsString()
  @IsNotEmpty()
  branchName!: string;

  @IsString()
  @IsOptional()
  branchAddress?: string;

  @IsString()
  @IsOptional()
  branchCity?: string;
}
