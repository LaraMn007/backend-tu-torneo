import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdateMatchDto {
  @IsOptional()
  @IsString()
  scheduledDate?: string | null;

  @IsOptional()
  @IsString()
  scheduledTime?: string | null;

  @ValidateIf(o => o.scoreA !== undefined || o.scoreB !== undefined || o.winnerTeamId !== undefined)
  @IsInt()
  @Min(0)
  scoreA?: number;

  @ValidateIf(o => o.scoreA !== undefined || o.scoreB !== undefined || o.winnerTeamId !== undefined)
  @IsInt()
  @Min(0)
  scoreB?: number;

  @ValidateIf(o => o.scoreA !== undefined || o.scoreB !== undefined || o.winnerTeamId !== undefined)
  @IsInt()
  winnerTeamId?: number;
}
