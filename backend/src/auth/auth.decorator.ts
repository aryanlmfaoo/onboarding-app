import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import accessPayload from './types/accesstoken.type';
import { AuthenticatedRequest } from './types/authenticatedRequest.types';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): accessPayload => {
    const request: AuthenticatedRequest = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
