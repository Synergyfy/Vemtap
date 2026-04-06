import { IsUUID, IsInt, Min, IsOptional, ValidateIf, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsUUID()
  branchId: string;

  @ValidateIf((o) => !o.offerId)
  @IsUUID()
  itemId?: string;

  @ValidateIf((o) => !o.itemId)
  @IsUUID()
  offerId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}

export class GuestCartItemDto {
  @ValidateIf((o) => !o.offerId)
  @IsUUID()
  itemId?: string;

  @ValidateIf((o) => !o.itemId)
  @IsUUID()
  offerId?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeGuestCartDto {
  @IsUUID()
  branchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items: GuestCartItemDto[];
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity: number;
}

export class CheckoutCartDto {
  @IsUUID()
  branchId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsUUID()
  @IsOptional()
  deviceId?: string;
}
