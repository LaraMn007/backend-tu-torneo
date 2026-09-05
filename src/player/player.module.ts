import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlayerController],
  providers: [PlayerService],
})
export class PlayerModule {}
