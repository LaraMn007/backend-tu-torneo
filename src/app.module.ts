import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { PlayerModule } from './player/player.module';

import { TeamModule } from './team/team.module';
import { RequestModule } from './request/request.module';
import { TournamentModule } from './tournament/tournament.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    PlayerModule,
    TeamModule,
    RequestModule,
    TournamentModule,
    NotificationModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
