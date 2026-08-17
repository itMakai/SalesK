import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum MovementType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
}

export class UpdateInventoryItemDto {
  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;
}

export class RecordMovementDto {
  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number; // can be negative for sales, transfer_out

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkRecordMovementDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
