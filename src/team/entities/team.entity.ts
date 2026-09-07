export class TeamEntity {
  idTeam!: number;
  name!: string;
  categoryId!: number;
  ownerId!: number;
  primaryColor!: string;
  alternativeColor!: string;
  image!: string | null;
  invitationCode!: string;
}