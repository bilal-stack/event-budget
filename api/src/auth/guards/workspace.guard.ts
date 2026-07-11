import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; workspaceId: string };
    const headerWorkspaceId = request.headers['x-workspace-id'];

    if (!headerWorkspaceId || headerWorkspaceId !== user.workspaceId) {
      throw new ForbiddenException('Workspace access denied');
    }

    return true;
  }
}
