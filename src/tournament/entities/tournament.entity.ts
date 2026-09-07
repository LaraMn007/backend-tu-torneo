import { TournamentStatus } from '@prisma/client';

export class TournamentEntity {
  idTournament!: number;
  idOwner!: number;
  name!: string;
  categoryId!: number;
  description!: string;
  estado!: TournamentStatus;
}