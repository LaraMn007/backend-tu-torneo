import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/\S/, { message: 'La contraseña no puede estar vacía' })
  password!: string;
}
