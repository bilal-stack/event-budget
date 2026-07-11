import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

@Injectable()
export class BudgetItemsService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  async findAll(eventId: string, workspaceId: string) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);
    return this.prisma.budgetItem.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    eventId: string,
    workspaceId: string,
    dto: CreateBudgetItemDto,
  ) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);
    return this.prisma.budgetItem.create({
      data: {
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency.toUpperCase(),
        eventId,
      },
    });
  }

  async update(
    eventId: string,
    id: string,
    workspaceId: string,
    dto: UpdateBudgetItemDto,
  ) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);
    const item = await this.prisma.budgetItem.findFirst({
      where: { id, eventId },
    });
    if (!item) throw new NotFoundException('Budget item not found');

    return this.prisma.budgetItem.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency !== undefined && { currency: dto.currency.toUpperCase() }),
      },
    });
  }

  async remove(eventId: string, id: string, workspaceId: string) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);
    const item = await this.prisma.budgetItem.findFirst({
      where: { id, eventId },
    });
    if (!item) throw new NotFoundException('Budget item not found');
    return this.prisma.budgetItem.delete({ where: { id } });
  }
}
