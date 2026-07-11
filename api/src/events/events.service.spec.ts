import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

const makeService = (budgetItems: any[] = []) => {
  const prisma = {
    event: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budgetItem: {
      findMany: jest.fn().mockResolvedValue(budgetItems),
    },
  } as any;
  return { service: new EventsService(prisma), prisma };
};

// Computes totalSpend and per-category breakdown from budget items on the event
test('findOneWithSummary — computes budget summary correctly', async () => {
  const items = [
    { amount: '1500.00', category: 'Catering', description: 'Buffet', currency: 'USD', id: '1', eventId: 'e-1', createdAt: new Date(), updatedAt: new Date() },
    { amount: '500.00', category: 'AV', description: 'Sound', currency: 'USD', id: '2', eventId: 'e-1', createdAt: new Date(), updatedAt: new Date() },
    { amount: '1000.00', category: 'Catering', description: 'Bar', currency: 'USD', id: '3', eventId: 'e-1', createdAt: new Date(), updatedAt: new Date() },
  ];

  const { service, prisma } = makeService();
  prisma.event.findFirst.mockResolvedValue({
    id: 'e-1', title: 'Gala', date: new Date(), currency: 'USD', workspaceId: 'ws-1',
    budgetItems: items,
  });

  const result = await service.findOneWithSummary('e-1', 'ws-1');

  expect(result.budgetSummary.totalSpend).toBe(3000);
  expect(result.budgetSummary.byCategory).toEqual({ Catering: 2500, AV: 500 });
});

// Returns 404 when event does not belong to the requesting workspace
test('findOneWithSummary — throws NotFoundException for wrong workspace', async () => {
  const { service, prisma } = makeService();
  prisma.event.findFirst.mockResolvedValue(null);

  await expect(service.findOneWithSummary('e-1', 'wrong-ws')).rejects.toThrow(NotFoundException);
});
