import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PlayerModule } from './player/player.module';


@Module({
  imports: [PrismaModule, UsersModule, PlayerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
