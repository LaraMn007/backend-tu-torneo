import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationService.create(createNotificationDto, user.idUser);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.findAllForUser(user.idUser);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllRead(user.idUser);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.findOne(id, user.idUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationService.update(id, updateNotificationDto, user.idUser);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.remove(id, user.idUser);
  }
}
