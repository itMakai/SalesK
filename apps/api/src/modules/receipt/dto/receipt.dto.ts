import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateReceiptTemplateDto {
  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  footer?: string;

  @IsBoolean()
  @IsOptional()
  showLogo?: boolean;

  @IsBoolean()
  @IsOptional()
  showTaxBreakdown?: boolean;

  @IsString()
  @IsOptional()
  customCss?: string;

  @IsObject()
  @IsOptional()
  template?: Record<string, any>;
}
