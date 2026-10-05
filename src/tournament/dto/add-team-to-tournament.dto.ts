import { IsInt, Min } from 'class-validator';

export class AddTeamToTournamentDto {
  @IsInt()
  @Min(1)
  teamId!: number;
}