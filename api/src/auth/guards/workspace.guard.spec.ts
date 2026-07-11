import { ForbiddenException } from '@nestjs/common';
import { WorkspaceGuard } from './workspace.guard';

const makeContext = (headerWorkspaceId: string | undefined, userWorkspaceId: string, isPublic = false) => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) } as any;
  const guard = new WorkspaceGuard(reflector);

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: 'u-1', workspaceId: userWorkspaceId },
        headers: { 'x-workspace-id': headerWorkspaceId },
      }),
    }),
  } as any;

  return { guard, context };
};

// Allows request when x-workspace-id header matches the JWT workspace
test('WorkspaceGuard — passes when header matches user workspace', () => {
  const { guard, context } = makeContext('ws-1', 'ws-1');
  expect(guard.canActivate(context)).toBe(true);
});

// Blocks request with 403 when x-workspace-id does not match JWT workspace
test('WorkspaceGuard — throws ForbiddenException when workspace mismatch', () => {
  const { guard, context } = makeContext('ws-other', 'ws-1');
  expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
});
