export class NotificationEntity {
  idNotification!: number;
  userId!: number;
  type!: string;
  title!: string;
  message!: string;
  teamId!: number | null;
  playerId!: number | null;
  read!: boolean;
  createdAt!: Date;
}