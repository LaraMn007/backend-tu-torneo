import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestService } from './request.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  create(@Body() createRequestDto: CreateRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.requestService.create(createRequestDto, user.idUser);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('teamId') teamId?: string,
    @Query('playerId') playerId?: string,
  ) {
    if (teamId) return this.requestService.findByTeam(Number(teamId), user.idUser);
    if (playerId) return this.requestService.findByPlayer(Number(playerId), user.idUser);
    return this.requestService.findAllForUser(user.idUser);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.requestService.findOne(id, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestDto: UpdateRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requestService.update(id, updateRequestDto, user.idUser);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.requestService.remove(id, user.idUser);
  }
}
