import sql from "mssql";

declare global {
  namespace Express {
    export interface Request {
      db: sql.ConnectionPool;
      userId?: string;
    }
  }
}
