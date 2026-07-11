import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(user.workspaceId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string; workspaceId: string }) {
    return this.eventsService.findAll(user.workspaceId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('id') id: string,
  ) {
    return this.eventsService.findOneWithSummary(id, user.workspaceId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.workspaceId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('id') id: string,
  ) {
    return this.eventsService.remove(id, user.workspaceId);
  }
}
