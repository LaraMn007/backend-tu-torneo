import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';
import { getJwtSecret } from './auth.config';

type JwtPayload = {
  sub: number;
  iat: number;
  exp: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (
      !Number.isInteger(payload.sub) ||
      payload.sub <= 0 ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    try {
      return await this.users.findByUSer(payload.sub);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token inválido');
    }
  }
}