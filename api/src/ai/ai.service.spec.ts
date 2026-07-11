import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ProposalStatus } from '@prisma/client';
import { AiService } from './ai.service';

const mockEvent = {
  id: 'event-1',
  title: 'Annual Gala',
  date: new Date('2025-12-15'),
  currency: 'USD',
  workspaceId: 'ws-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeService = (overrides: Record<string, any> = {}) => {
  const prisma = {
    aiProposal: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    budgetItem: { createMany: jest.fn() },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    ...overrides,
  } as any;

  const eventsService = {
    findOneOrThrow: jest.fn().mockResolvedValue(mockEvent),
  } as any;

  const gemini = {
    generateProposal: jest.fn(),
  } as any;

  const gateway = { emitBudgetUpdated: jest.fn() } as any;
  return { service: new AiService(prisma, eventsService, gemini, gateway), prisma, gemini, gateway };
};

// Rejects proposals when Gemini returns items in a different currency than the event
test('chat — rejects when Gemini returns wrong currency', async () => {
  const { service, prisma, gemini } = makeService();

  prisma.aiProposal.findFirst.mockResolvedValue(null);
  gemini.generateProposal.mockResolvedValue([
    { category: 'Catering', description: 'Dinner', amount: 5000, currency: 'EUR' },
  ]);

  await expect(service.chat('event-1', 'ws-1', 'plan a dinner')).rejects.toThrow(
    UnprocessableEntityException,
  );
});

// Blocks a new chat request when a PENDING proposal already exists for the event
test('chat — blocks when a pending proposal already exists', async () => {
  const { service, prisma } = makeService();

  prisma.aiProposal.findFirst.mockResolvedValue({ id: 'p-1', status: ProposalStatus.PENDING });

  await expect(service.chat('event-1', 'ws-1', 'plan a dinner')).rejects.toThrow(
    ConflictException,
  );
});

// Throws 404 when trying to approve but no pending proposal exists
test('approve — throws 404 when no pending proposal found', async () => {
  const { service, prisma } = makeService();

  prisma.aiProposal.findFirst.mockResolvedValue(null);

  await expect(service.approve('event-1', 'ws-1')).rejects.toThrow(NotFoundException);
});

// Writes all proposal items to BudgetItem and marks proposal APPROVED in one transaction
test('approve — writes budget items and marks proposal approved', async () => {
  const { service, prisma } = makeService();

  const proposal = {
    id: 'p-1',
    status: ProposalStatus.PENDING,
    items: [
      { category: 'AV', description: 'Sound system', amount: 2000, currency: 'USD' },
      { category: 'Catering', description: 'Buffet', amount: 3000, currency: 'USD' },
    ],
  };

  prisma.aiProposal.findFirst.mockResolvedValue(proposal);
  prisma.budgetItem.findMany = jest.fn().mockResolvedValue([]);

  await service.approve('event-1', 'ws-1');

  expect(prisma.$transaction).toHaveBeenCalled();
  expect(prisma.budgetItem.createMany).toHaveBeenCalledWith({
    data: expect.arrayContaining([
      expect.objectContaining({ category: 'AV', amount: 2000, eventId: 'event-1' }),
      expect.objectContaining({ category: 'Catering', amount: 3000, eventId: 'event-1' }),
    ]),
  });
  expect(prisma.aiProposal.update).toHaveBeenCalledWith({
    where: { id: 'p-1' },
    data: { status: ProposalStatus.APPROVED },
  });
});
