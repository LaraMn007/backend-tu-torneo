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
  Query,
} from '@nestjs/common';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddPlayerToTeamDto } from './dto/add-player-to-team.dto';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @Post()
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  @Get()
  findAll() {
    return this.teamService.findAll();
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.teamService.findByOwner(ownerId);
  }

  @Get('owner/:ownerId/category/:categoryId')
  findByOwnerAndCategory(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.teamService.findByOwnerAndCategory(ownerId, categoryId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamService.findOne(id);
  }

  @Post(':id/players')
  addPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPlayerToTeamDto,
  ) {
    return this.teamService.addPlayer(id, dto.playerId);
  }

  @Delete(':id/players/:playerId')
  removePlayer(
    @Param('id', ParseIntPipe) id: number,
    @Param('playerId', ParseIntPipe) playerId: number,
  ) {
    return this.teamService.removePlayer(id, playerId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.teamService.remove(id);
  }
}
