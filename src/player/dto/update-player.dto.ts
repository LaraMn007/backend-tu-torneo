import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayerDto } from './create-player.dto';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class UpdatePlayerDto extends PartialType(CreatePlayerDto) {
  @IsNotEmpty()
  @IsDateString()
  dateBirth!: string;
}
