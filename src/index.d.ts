import { User } from './users/user-schema';

declare global {
  declare namespace Express {
    export interface Request {
      user: Pick<User, 'id', 'login'> | null;
    }
  }
}
