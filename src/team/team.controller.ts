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

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddPlayerToTeamDto } from './dto/add-player-to-team.dto';
import { TeamService } from './team.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.teamService.create(createTeamDto, user.idUser);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.teamService.findAllForUser(user.idUser);
  }

  @Get('owner/:ownerId')
  findByOwner(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamService.findByOwnerForUser(ownerId, user.idUser);
  }

  @Get('owner/:ownerId/category/:categoryId')
  findByOwnerAndCategory(
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamService.findByOwnerAndCategoryForUser(ownerId, categoryId, user.idUser);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.teamService.findOneForUser(id, user.idUser);
  }

  @Post(':id/players')
  addPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPlayerToTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamService.addPlayer(id, dto.playerId, user.idUser);
  }

  @Delete(':id/players/:playerId')
  removePlayer(
    @Param('id', ParseIntPipe) id: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamService.removePlayer(id, playerId, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamService.update(id, updateTeamDto, user.idUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.teamService.remove(id, user.idUser);
  }
}
