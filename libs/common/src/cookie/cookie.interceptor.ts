import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { SET_COOKIE_KEY } from './set-cookie.decorator';
import { SetCookieMetadata } from '../interfaces/cookie.interface';

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const metadata = this.reflector.get<SetCookieMetadata>(
          SET_COOKIE_KEY,
          context.getHandler(),
        );

        if (metadata) {
          const response = context.switchToHttp().getResponse<Response>();

          let valueToSet = data;

          if (metadata.fromField && data && typeof data === 'object') {
            valueToSet = data[metadata.fromField];
          }

          if (valueToSet && typeof valueToSet === 'string') {
            response.cookie(metadata.key, valueToSet, metadata.options || {});
          }
        }

        return data;
      }),
    );
  }
}
