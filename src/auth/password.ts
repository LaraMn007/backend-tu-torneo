import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SCRYPT_PREFIX = 'scrypt';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;

  return `${SCRYPT_PREFIX}$16384$8$1$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: unknown,
): Promise<boolean> {
  if (typeof storedHash !== 'string') {
    return false;
  }

  const match = storedHash.match(
    /^scrypt\$16384\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/,
  );

  if (!match) {
    return false;
  }

  const [, salt, hash] = match;

  try {
    const key = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hash, 'hex');

    if (expected.length !== key.length) {
      return false;
    }

    return timingSafeEqual(expected, key);
  } catch {
    return false;
  }
}
