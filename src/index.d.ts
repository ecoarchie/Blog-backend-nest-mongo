import { User } from './users/user-schema';

declare global {
  declare namespace Express {
    export interface Request {
      userId: User['id'] | null;
    }
  }
}
