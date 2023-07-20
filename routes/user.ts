import express from "express";
import sql from "mssql";
import { validationResult, param, matchedData } from "express-validator";
import { Errors } from "../types";
import { logError } from "../helpers";

const router = express.Router();

router.get(
  "/:userId",
  param("userId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const auth0Id = req.userId;
      const { userId } = matchedData(req);
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), auth0Id)
        .input("UserId", sql.Int, userId)
        .execute<Record<string, unknown>[]>("spUser_Get")
        .then((result) => {
          const user = result.recordset[0];
          if (!user) {
            return res.status(404).send({ errors: ["User not found"] });
          }
          return res.send(user);
        })
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

export default router;
