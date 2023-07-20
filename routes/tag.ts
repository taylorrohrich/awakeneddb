import express from "express";
import sql from "mssql";
import { matchedData, param, validationResult } from "express-validator";
import { Errors } from "../types";
import { logError } from "../helpers";

const router = express.Router();

/// Unauthenticated routes

router.get("/list", (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const userId = req.userId;
    req.db
      .request()
      .input("Auth0Id", sql.NVarChar(200), userId)
      .execute<Record<string, unknown>[]>("spTag_List")
      .then((result) => {
        return res.send(result.recordsets[0]);
      })
      .catch((err) => {
        logError(err);
        next(Errors.Database);
      });
  } else {
    res.status(400).send({ errors: errors.array() });
  }
});

router.get(
  "/:tagId",
  param("tagId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const userId = req.userId;
      const { tagId } = matchedData(req);
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("TagId", sql.Int, tagId)
        .execute<Record<string, unknown>[]>("spTag_Get")
        .then((result) => {
          const echo = result.recordset[0];
          if (!echo) {
            return res.status(404).send({ errors: ["Tag not found"] });
          }
          return res.send(echo);
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
