import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(workspaceId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        date: new Date(dto.date),
        currency: dto.currency.toUpperCase(),
        workspaceId,
      },
    });
  }

  findAll(workspaceId: string) {
    return this.prisma.event.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { budgetItems: true } },
        budgetItems: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(id: string, workspaceId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, workspaceId },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findOneWithSummary(id: string, workspaceId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, workspaceId },
      include: { budgetItems: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const totalSpend = event.budgetItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const byCategory = event.budgetItems.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + Number(item.amount);
        return acc;
      },
      {},
    );

    return {
      ...event,
      budgetSummary: { totalSpend, byCategory },
    };
  }

  async update(id: string, workspaceId: string, dto: UpdateEventDto) {
    await this.findOneOrThrow(id, workspaceId);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.currency && { currency: dto.currency.toUpperCase() }),
      },
    });
  }

  async remove(id: string, workspaceId: string) {
    await this.findOneOrThrow(id, workspaceId);
    return this.prisma.event.delete({ where: { id } });
  }
}
