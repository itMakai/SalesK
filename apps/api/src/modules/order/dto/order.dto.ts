import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MPESA = 'mpesa',
}

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsArray()
  @IsOptional()
  modifiers?: any[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method!: PaymentMethod;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsOptional()
  gateway?: string;

  @IsString()
  @IsOptional()
  gatewayRef?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsOptional()
  tenantId?: string; // Injected server-side from JWT, optional from client

  @IsString()
  @IsOptional()
  terminalId?: string;

  @IsString()
  @IsOptional()
  type?: string; // sale, refund — defaults to 'sale'

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  redeemedPoints?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  items!: CreateOrderItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  @IsOptional()
  payments?: CreatePaymentDto[];
}
