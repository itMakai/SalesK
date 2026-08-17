import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordCashDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  notes?: string;
}

export class PaystackChargeDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class SplitPaymentItemDto {
  @IsString()
  @IsNotEmpty()
  method: string; // 'cash', 'mpesa', 'card'

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  phone?: string; // For M-Pesa

  @IsOptional()
  @IsString()
  email?: string; // For PayStack
}

export class SplitPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitPaymentItemDto)
  payments: SplitPaymentItemDto[];
}
