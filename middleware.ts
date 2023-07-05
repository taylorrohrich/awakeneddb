import { Request, Response, NextFunction } from "express";
import { Errors } from "./types";

export function authenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    next(Errors.Authentication);
  }
  req.userId = req.auth?.payload.sub;
  next();
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  switch (err) {
    case Errors.Authentication:
      return res.status(401).send({ errors: [Errors.Authentication] });
    case Errors.Database:
      return res.status(400).send({ errors: [Errors.Database] });
  }
  next(err);
}
