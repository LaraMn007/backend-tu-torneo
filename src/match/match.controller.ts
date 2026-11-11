import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';

import { MatchService } from './match.service';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  findByTournament(
    @Query('tournamentId', ParseIntPipe) tournamentId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matchService.findByTournament(tournamentId, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.matchService.update(id, dto, user.idUser);
  }
}
