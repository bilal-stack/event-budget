import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

const makeService = () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    workspace: { create: jest.fn() },
    $transaction: jest.fn((fn: any) =>
      fn({
        workspace: { create: jest.fn().mockResolvedValue({ id: 'ws-1' }) },
        user: { create: jest.fn().mockResolvedValue({ id: 'u-1', workspaceId: 'ws-1' }) },
      }),
    ),
  } as any;

  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as any;

  return { service: new AuthService(prisma, jwt), prisma, jwt };
};

// Throws ConflictException when email is already registered
test('register — throws conflict if email already exists', async () => {
  const { service, prisma } = makeService();
  prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

  await expect(
    service.register({ email: 'a@a.com', password: 'pass123', workspaceName: 'Co' }),
  ).rejects.toThrow(ConflictException);
});

// Throws UnauthorizedException when password does not match stored hash
test('login — throws UnauthorizedException on wrong password', async () => {
  const { service, prisma } = makeService();
  prisma.user.findUnique.mockResolvedValue({
    id: 'u-1',
    workspaceId: 'ws-1',
    // bcrypt hash of "correctpassword"
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  });

  await expect(
    service.login({ email: 'a@a.com', password: 'wrongpassword' }),
  ).rejects.toThrow(UnauthorizedException);
});
