import { RequestStatus, RequestType } from '@prisma/client';

export class RequestEntity {
  idRequest!: number;
  idTeam!: number;
  idPlayer!: number;
  type!: RequestType;
  status!: RequestStatus;
  createdAt!: Date;
}
