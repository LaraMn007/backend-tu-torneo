export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return secret;
}

export function getJwtExpiresIn(): number {
  const value = process.env.JWT_EXPIRES_IN ?? '3600';
  const expiresIn = Number(value);

  if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
    throw new Error('JWT_EXPIRES_IN debe ser un entero positivo');
  }

  return expiresIn;
}