import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { AddTeamToTournamentDto } from './dto/add-team-to-tournament.dto';
import { TournamentService } from './tournament.service';

@Controller('tournament')
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
  ) { }

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentService.create(createTournamentDto);
  }

  @Get()
  findAll() {
    return this.tournamentService.findAll();
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.tournamentService.findByOwner(ownerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentService.findOne(id);
  }

  @Post(':id/teams')
  addTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddTeamToTournamentDto,
  ) {
    return this.tournamentService.addTeam(id, dto.teamId);
  }

  @Delete(':id/teams/:teamId')
  removeTeam(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.tournamentService.removeTeam(id, teamId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.tournamentService.remove(id);
  }
}