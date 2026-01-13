import { CookieOptions } from 'express';

export interface SetCookieMetadata {
  key: string;
  fromField?: any;
  options?: CookieOptions;
}
