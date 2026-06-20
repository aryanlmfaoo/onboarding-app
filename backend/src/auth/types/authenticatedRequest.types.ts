import { Request } from 'express';
import accessPayload from './accesstoken.type';

export interface AuthenticatedRequest extends Request {
  user: accessPayload;
}
