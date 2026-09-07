import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,} from '@nestjs/common';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentService } from './tournament.service';

@Controller('tournament')
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
  ) {}

  @Post()
  create(@Body() createTournamentDto: CreateTournamentDto) {
    return this.tournamentService.create(createTournamentDto);
  }

  @Get()
  findAll() {
    return this.tournamentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ) {
    return this.tournamentService.update(id, updateTournamentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentService.remove(id);
  }
}