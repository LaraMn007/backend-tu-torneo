import {Injectable,OnModuleDestroy,OnModuleInit,} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const schema = connectionString
      ? new URL(connectionString).searchParams.get('schema') ?? 'public'
      : 'public';
    const adapter = new PrismaPg(
      { connectionString },
      { schema },
    );
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

}