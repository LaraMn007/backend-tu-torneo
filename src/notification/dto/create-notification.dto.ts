import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsInt()
  userId!: number;

  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  message!: string;

  @IsOptional()
  @IsInt()
  teamId?: number;

  @IsOptional()
  @IsInt()
  playerId?: number;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
