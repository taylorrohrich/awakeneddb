import express from "express";
import sql from "mssql";
import {
  query,
  param,
  body,
  validationResult,
  matchedData,
} from "express-validator";
import { authenticated } from "../middleware";
import { Errors } from "../types";
import { logError } from "../helpers";
const router = express.Router();

/// Unauthenticated routes

router.get(
  "/list",
  query("page").notEmpty().isNumeric(),
  query("limit").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { page, limit } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("page", sql.BigInt, page)
        .input("limit", sql.BigInt, limit)
        .execute<Record<string, unknown>[]>("spDeck_List")
        .then((result) => {
          const [[pagination], data] = result.recordsets;
          return res.send({ ...pagination, data });
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
  "/:deckId",
  param("deckId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("deckId", sql.BigInt, deckId)
        .execute<Record<string, unknown>[]>("spDeck_Get")
        .then((result) => {
          const deck = result.recordset[0];
          if (!deck) {
            return res.status(404).send({ errors: ["Deck not found"] });
          }
          res.send(deck);
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

// Authenticated routes

router.post(
  "/",
  authenticated,
  body("name").notEmpty(),
  body("categoryId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { name, categoryId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Name", sql.NVarChar(200), name)
        .input("CategoryId", sql.BigInt, categoryId)
        .execute("spDeck_Add")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.put(
  "/:deckId",
  authenticated,
  param("deckId").notEmpty().isNumeric(),
  body("name").notEmpty(),
  body("categoryId").notEmpty().isNumeric(),
  body("echoId").optional().isNumeric(),
  body("description").optional(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { name, categoryId, echoId, description, deckId } =
        matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("deckId", sql.BigInt, deckId)
        .input("Name", sql.NVarChar(200), name)
        .input("CategoryId", sql.BigInt, categoryId)
        .input("EchoId", sql.BigInt, echoId)
        .input("Description", sql.NVarChar(2000), description)
        .execute("spDeck_Update")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.delete(
  "/:deckId",
  authenticated,
  param("deckId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckId", sql.BigInt, deckId)
        .execute<Record<string, unknown>[]>("spDeck_Remove")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.post(
  "/:deckId/card",
  authenticated,
  param("deckId").notEmpty().isNumeric(),
  body("cardId").notEmpty().isNumeric(),
  body("position").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckId, cardId, position } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckId", sql.BigInt, deckId)
        .input("CardId", sql.BigInt, cardId)
        .input("Position", sql.BigInt, position)
        .execute("spDeckCard_Add")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.put(
  "/card/:deckCardId",
  authenticated,
  param("deckCardId").notEmpty().isNumeric(),
  body("cardId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckCardId, cardId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckCardId", sql.BigInt, deckCardId)
        .input("CardId", sql.BigInt, cardId)
        .execute("spDeckCard_Update")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.delete(
  "/card/:deckCardId",
  authenticated,
  param("deckCardId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckCardId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckCardId", sql.BigInt, deckCardId)
        .execute("spDeckCard_Remove")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.post(
  "/:deckId/vote",
  authenticated,
  param("deckId").notEmpty().isNumeric(),
  body("upvote").notEmpty().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckId, upvote } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckId", sql.BigInt, deckId)
        .input("Upvote", sql.TinyInt, upvote)
        .execute("spVote_Add")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.put(
  "/vote/:voteId",
  authenticated,
  param("voteId").notEmpty().isNumeric(),
  body("upvote").notEmpty().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { voteId, upvote } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("VoteId", sql.BigInt, voteId)
        .input("Upvote", sql.TinyInt, upvote)
        .execute("spVote_Update")
        .then((result) => res.send({ success: !!result.returnValue }))
        .catch((err) => {
          logError(err);
          next(Errors.Database);
        });
    } else {
      res.status(400).send({ errors: errors.array() });
    }
  }
);

router.delete(
  "/vote/:voteId",
  authenticated,
  param("voteId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { voteId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("VoteId", sql.BigInt, voteId)
        .execute("spVote_Remove")
        .then((result) => res.send({ success: !!result.returnValue }))
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
