import { IsEnum, IsOptional } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateRequestDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
