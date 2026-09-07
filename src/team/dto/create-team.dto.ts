import {IsInt,IsNotEmpty,IsOptional,IsString,MinLength,} from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNotEmpty()
  @IsInt()
  categoryId!: number;

  @IsNotEmpty()
  @IsInt()
  ownerId!: number;

  @IsNotEmpty()
  @IsString()
  primaryColor!: string;

  @IsNotEmpty()
  @IsString()
  alternativeColor!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  invitationCode!: string;
}