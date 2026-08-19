import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateTableDto {
  @IsString()
  branchId: string;

  @IsString()
  name: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  @IsOptional()
  posX?: number;

  @IsNumber()
  @IsOptional()
  posY?: number;
}

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  @IsOptional()
  posX?: number;

  @IsNumber()
  @IsOptional()
  posY?: number;

  @IsString()
  @IsOptional()
  @IsIn(['available', 'occupied', 'reserved'])
  status?: string;
}
