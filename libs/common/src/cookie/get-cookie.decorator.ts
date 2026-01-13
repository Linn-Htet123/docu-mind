import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SET_COOKIE_KEY } from './set-cookie.decorator';
import { SetCookieMetadata } from '../interfaces/cookie.interface';

type keyType = string | symbol | undefined;
export const GetCookie = createParamDecorator(
  (data: string | symbol, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const handler = ctx.getHandler();
    const classRef = ctx.getClass();
    let cookieName: keyType;
    const metadata =
      Reflect.getMetadata(SET_COOKIE_KEY, handler) ||
      Reflect.getMetadata(SET_COOKIE_KEY, classRef);

    if (typeof data === 'string' || typeof data === 'symbol') {
      cookieName = data;
    } else if (metadata) {
      cookieName = (metadata as SetCookieMetadata).key;
    }

    if (cookieName && request.cookies) {
      return request.cookies[cookieName];
    }
  },
);
