import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { PlayerModule } from './player/player.module';

import { TeamModule } from './team/team.module';
import { RequestModule } from './request/request.module';
import { TournamentModule } from './tournament/tournament.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [PrismaModule, UsersModule, PlayerModule, TeamModule, RequestModule, TournamentModule, NotificationModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
