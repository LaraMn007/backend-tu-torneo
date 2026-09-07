import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { RequestStatus, RequestType } from '@prisma/client';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsInt()
  idTeam!: number;

  @IsNotEmpty()
  @IsInt()
  idPlayer!: number;

  @IsNotEmpty()
  @IsEnum(RequestType)
  type!: RequestType;

  @IsNotEmpty()
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}
