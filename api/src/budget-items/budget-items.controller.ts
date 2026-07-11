import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BudgetItemsService } from './budget-items.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('events/:eventId/budget-items')
export class BudgetItemsController {
  constructor(private budgetItemsService: BudgetItemsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
  ) {
    return this.budgetItemsService.findAll(eventId, user.workspaceId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
    @Body() dto: CreateBudgetItemDto,
  ) {
    return this.budgetItemsService.create(eventId, user.workspaceId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetItemDto,
  ) {
    return this.budgetItemsService.update(eventId, id, user.workspaceId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
    @Param('id') id: string,
  ) {
    return this.budgetItemsService.remove(eventId, id, user.workspaceId);
  }
}
