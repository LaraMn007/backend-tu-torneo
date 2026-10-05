import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { TournamentStatus } from '@prisma/client';

export class CreateTournamentDto {
  @IsNotEmpty()
  @IsInt()
  idOwner!: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNotEmpty()
  @IsInt()
  categoryId!: number;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNotEmpty()
  @IsEnum(TournamentStatus)
  estado!: TournamentStatus;
}
