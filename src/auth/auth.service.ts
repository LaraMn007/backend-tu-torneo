import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { verifyPassword } from './password';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$00000000000000000000000000000000$' +
  '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.users.findCredentialsByEmail(loginDto.email);
    const valid = await verifyPassword(
      loginDto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.jwt.signAsync({ sub: user.idUser });
    const payload = this.jwt.decode<{ exp: number; iat: number }>(accessToken);

    return {
      access_token: accessToken,
      token_type: 'Bearer' as const,
      expires_in: payload.exp - payload.iat,
    };
  }
}