import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class StockTransferItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;
}

export class CreateStockTransferDto {
  @IsString()
  fromBranchId: string;

  @IsString()
  toBranchId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items: StockTransferItemDto[];
}

export class UpdateStockTransferStatusDto {
  @IsString()
  @IsIn(['pending', 'shipped', 'received', 'cancelled'])
  status: string;
}
