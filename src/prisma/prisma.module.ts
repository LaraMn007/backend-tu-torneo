import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], //Esto registra PrismaService dentro del módulo.
  exports: [PrismaService], //Permite que otros módulos puedan utilizarlo.
})
export class PrismaModule {}
