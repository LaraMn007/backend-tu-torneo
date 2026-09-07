import {
  IsEnum,
  IsInt,
  IsNotEmpty,
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

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  description!: string;

  @IsNotEmpty()
  @IsEnum(TournamentStatus)
  estado!: TournamentStatus;
}
