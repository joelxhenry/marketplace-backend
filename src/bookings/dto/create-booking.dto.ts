import {
  IsString,
  IsDateString,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GuestInfoDto } from './guest-info.dto';

export class CreateBookingDto {
  // Customer identification - either customerId OR guestInfo must be provided
  @ValidateIf((o) => !o.guestInfo)
  @IsUUID()
  customerId?: string;

  @ValidateIf((o) => !o.customerId)
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;

  @IsUUID()
  providerId: string;

  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  providerUserId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsOptional()
  @IsString()
  customerNotes?: string;
}