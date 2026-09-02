import { IsInt, IsNotEmpty, IsString, MinLength, IsDateString} from 'class-validator';
export class CreatePlayerDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    name!: string;

    @IsNotEmpty()
    @IsInt()
    idUser!: number;

    @IsNotEmpty()
    @IsDateString()
    dateBirth!: string;
}