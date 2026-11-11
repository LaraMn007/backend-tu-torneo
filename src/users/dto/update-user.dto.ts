import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/\S/, { message: 'La contraseña no puede estar vacía' })
  password?: string;
}
