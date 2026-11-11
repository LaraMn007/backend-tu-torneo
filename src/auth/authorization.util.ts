import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from './current-user.decorator';

export function assertSelf(user: AuthenticatedUser, targetUserId: number): void {
  if (user.idUser !== targetUserId) {
    throw new ForbiddenException('No tenés permiso para acceder a este recurso.');
  }
}

export function isSelf(user: AuthenticatedUser, targetUserId: number): boolean {
  return user.idUser === targetUserId;
}

export function assertOwner(
  user: AuthenticatedUser,
  ownerId: number,
  message = 'No tenés permiso para gestionar este recurso.',
): void {
  if (user.idUser !== ownerId) {
    throw new ForbiddenException(message);
  }
}

export function assertAny(
  condition: boolean,
  message = 'No tenés permiso para realizar esta acción.',
): void {
  if (!condition) {
    throw new ForbiddenException(message);
  }
}
