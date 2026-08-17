import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestedTenantId = request.headers['x-tenant-id'] || request.query.tenantId || request.body.tenantId;

    if (!user) {
      return false;
    }

    if (requestedTenantId && user.tenantId !== requestedTenantId) {
      throw new ForbiddenException('You do not have access to this tenant.');
    }

    // Default to user's tenant if not explicitly provided
    request.tenantId = user.tenantId;
    return true;
  }
}
