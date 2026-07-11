import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProposalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { GeminiService } from './gemini.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private gemini: GeminiService,
    private gateway: EventsGateway,
  ) {}

  async chat(eventId: string, workspaceId: string, message: string) {
    const event = await this.eventsService.findOneOrThrow(eventId, workspaceId);

    const pending = await this.prisma.aiProposal.findFirst({
      where: { eventId, status: ProposalStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException(
        'A pending proposal already exists for this event. Approve or reject it first.',
      );
    }

    const items = await this.gemini.generateProposal(event, message);

    const invalid = items.filter(
      (i) => i.currency.toUpperCase() !== event.currency.toUpperCase(),
    );
    if (invalid.length > 0) {
      throw new UnprocessableEntityException(
        `Gemini returned wrong currency on ${invalid.length} item(s). Expected ${event.currency}.`,
      );
    }

    return this.prisma.aiProposal.create({
      data: { eventId, items: items as any, status: ProposalStatus.PENDING },
    });
  }

  async getPendingProposal(eventId: string, workspaceId: string) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);
    const proposal = await this.prisma.aiProposal.findFirst({
      where: { eventId, status: ProposalStatus.PENDING },
    });
    return proposal ?? null;
  }

  async approve(eventId: string, workspaceId: string) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);

    const proposal = await this.prisma.aiProposal.findFirst({
      where: { eventId, status: ProposalStatus.PENDING },
    });
    if (!proposal) throw new NotFoundException('No pending proposal found for this event.');

    const items = proposal.items as Array<{
      category: string;
      description: string;
      amount: number;
      currency: string;
    }>;

    const event = await this.eventsService.findOneOrThrow(eventId, workspaceId);

    await this.prisma.$transaction([
      this.prisma.budgetItem.createMany({
        data: items.map((i) => ({
          category: i.category,
          description: i.description,
          amount: i.amount,
          currency: i.currency,
          eventId,
        })),
      }),
      this.prisma.aiProposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.APPROVED },
      }),
    ]);

    this.gateway.emitBudgetUpdated(event.workspaceId, eventId);

    return this.prisma.budgetItem.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reject(eventId: string, workspaceId: string) {
    await this.eventsService.findOneOrThrow(eventId, workspaceId);

    const proposal = await this.prisma.aiProposal.findFirst({
      where: { eventId, status: ProposalStatus.PENDING },
    });
    if (!proposal) throw new NotFoundException('No pending proposal found for this event.');

    await this.prisma.aiProposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.REJECTED },
    });

    return { success: true };
  }
}
