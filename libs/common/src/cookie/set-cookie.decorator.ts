import { SetMetadata } from '@nestjs/common';
import { SetCookieMetadata } from '../interfaces/cookie.interface';

export const SET_COOKIE_KEY = 'SET_COOKIE_KEY';

export const SetCookie = ({ key, fromField, options }: SetCookieMetadata) =>
  SetMetadata(SET_COOKIE_KEY, { key, fromField, options });
