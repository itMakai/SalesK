import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsObject()
  @IsOptional()
  dashboardConfig?: Record<string, any>;
}
