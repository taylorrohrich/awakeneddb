import express from "express";
import sql from "mssql";
import { query, param, validationResult, matchedData } from "express-validator";
import { Errors } from "../types";
import { logError, rarityValidator, typeValidator } from "../helpers";

const router = express.Router();

/// Unauthenticated routes

router.get(
  "/list",
  query("rarity").optional().custom(rarityValidator),
  query("cost").optional().isNumeric(),
  query("type").optional().custom(typeValidator),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { rarity, cost, type } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Cost", sql.BigInt, cost)
        .input("RarityName", sql.NVarChar(200), rarity)
        .input("TypeName", sql.NVarChar(200), type)
        .execute<Record<string, unknown>[]>("spCard_List")
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
  }
);

router.get(
  "/:cardId",
  param("cardId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { cardId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("CardId", sql.BigInt, cardId)
        .execute<Record<string, unknown>[]>("spCard_Get")
        .then((result) => {
          const [[card], types] = result.recordsets;

          if (!card) {
            return res.status(404).send({ errors: ["Card not found"] });
          }

          return res.send({ ...card, types: types ?? [] });
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
