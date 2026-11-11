import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { AddTeamToTournamentDto } from './dto/add-team-to-tournament.dto';
import { TournamentService } from './tournament.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('tournament')
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
  ) { }

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tournamentService.create(createTournamentDto, user.idUser);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.tournamentService.findAllForUser(user.idUser);
  }

  @Get('owner/:ownerId')
  findByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tournamentService.findByOwnerForUser(ownerId, user.idUser);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.tournamentService.findOneForUser(id, user.idUser);
  }

  @Post(':id/teams')
  addTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddTeamToTournamentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tournamentService.addTeam(id, dto.teamId, user.idUser);
  }

  @Delete(':id/teams/:teamId')
  removeTeam(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tournamentService.removeTeam(id, teamId, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tournamentService.update(id, updateTournamentDto, user.idUser);
  }

  @Post(':id/draw')
  draw(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tournamentService.draw(id, user.idUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.tournamentService.remove(id, user.idUser);
  }
}
