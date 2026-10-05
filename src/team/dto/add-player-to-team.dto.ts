import { IsInt, Min } from 'class-validator';

export class AddPlayerToTeamDto {
  @IsInt()
  @Min(1)
  playerId!: number;
}