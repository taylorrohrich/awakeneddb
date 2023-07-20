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
import {
  durationValidator,
  isTextExplicit,
  limitValidator,
  logError,
  parseDeckResponse,
} from "../helpers";
const router = express.Router();

/// Unauthenticated routes

router.get(
  "/list",
  query("page").notEmpty().isNumeric(),
  query("limit").notEmpty().isNumeric().custom(limitValidator),
  query("duration").optional().isNumeric().custom(durationValidator),
  query("costLow").optional().isNumeric(),
  query("costHigh").optional().isNumeric(),
  query("tagId").optional().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { page, limit, duration, costLow, costHigh, tagId } =
        matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Page", sql.Int, page)
        .input("Limit", sql.Int, limit)
        .input("Duration", sql.Int, duration)
        .input("CostLow", sql.Int, costLow)
        .input("CostHigh", sql.Int, costHigh)
        .input("TagId", sql.Int, tagId)
        .execute<Record<string, unknown>[]>("spDeck_List")
        .then((result) => {
          const [[pagination], data = []] = result.recordsets;
          const parsedData = data.map((deck) => parseDeckResponse(deck));
          return res.send({ ...pagination, data: parsedData });
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
        .input("deckId", sql.Int, deckId)
        .execute<Record<string, unknown>[]>("spDeck_Get")
        .then((result) => {
          const deck = result.recordset[0];
          if (!deck) {
            return res.status(404).send({ errors: ["Deck not found"] });
          }

          res.send(parseDeckResponse(deck));
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
  "/user/:userId/list",
  param("userId").notEmpty().isNumeric(),
  query("page").notEmpty().isNumeric(),
  query("limit").notEmpty().isNumeric().custom(limitValidator),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { page, limit, userId } = matchedData(req);
      const auth0Id = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), auth0Id)
        .input("Page", sql.Int, page)
        .input("Limit", sql.Int, limit)
        .input("SearchUserId", sql.Int, userId)
        .execute<Record<string, unknown>[]>("spDeck_List")
        .then((result) => {
          const [[pagination], data = []] = result.recordsets;
          const parsedData = data.map((deck) => parseDeckResponse(deck));
          return res.send({ ...pagination, data: parsedData });
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

router.get(
  "/profile/list",
  authenticated,
  query("page").notEmpty().isNumeric(),
  query("limit").notEmpty().isNumeric().custom(limitValidator),

  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { page, limit } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Page", sql.Int, page)
        .input("Limit", sql.Int, limit)
        .execute<Record<string, unknown>[]>("spProfile_DeckList")
        .then((result) => {
          const [[pagination], data = []] = result.recordsets;
          const parsedData = data.map((deck) => parseDeckResponse(deck));
          return res.send({ ...pagination, data: parsedData });
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

router.post(
  "/",
  authenticated,
  body("name").notEmpty(),
  body("tagId").notEmpty().isNumeric(),
  body("echoId").notEmpty().isNumeric(),
  body("description").notEmpty(),
  body("magicCardOneId").notEmpty().isNumeric(),
  body("magicCardTwoId").notEmpty().isNumeric(),
  body("magicCardThreeId").notEmpty().isNumeric(),
  body("magicCardFourId").notEmpty().isNumeric(),
  body("magicCardFiveId").notEmpty().isNumeric(),
  body("magicCardSixId").notEmpty().isNumeric(),
  body("magicCardSevenId").notEmpty().isNumeric(),
  body("magicCardEightId").notEmpty().isNumeric(),
  body("companionCardOneId").notEmpty().isNumeric(),
  body("companionCardTwoId").notEmpty().isNumeric(),
  body("companionCardThreeId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const {
        name,
        tagId,
        echoId,
        description,
        magicCardOneId,
        magicCardTwoId,
        magicCardThreeId,
        magicCardFourId,
        magicCardFiveId,
        magicCardSixId,
        magicCardSevenId,
        magicCardEightId,
        companionCardOneId,
        companionCardTwoId,
        companionCardThreeId,
      } = matchedData(req);
      const userId = req.userId;

      const isExplicit = isTextExplicit(name) || isTextExplicit(description);
      if (isExplicit) {
        return res
          .status(400)
          .send({ errors: ["Name / Description must not include profanity"] });
      }
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Name", sql.NVarChar(200), name)
        .input("TagId", sql.Int, tagId)
        .input("EchoId", sql.Int, echoId)
        .input("Description", sql.NVarChar(4000), description)
        .input("MagicCardOneId", sql.Int, magicCardOneId)
        .input("MagicCardTwoId", sql.Int, magicCardTwoId)
        .input("MagicCardThreeId", sql.Int, magicCardThreeId)
        .input("MagicCardFourId", sql.Int, magicCardFourId)
        .input("MagicCardFiveId", sql.Int, magicCardFiveId)
        .input("MagicCardSixId", sql.Int, magicCardSixId)
        .input("MagicCardSevenId", sql.Int, magicCardSevenId)
        .input("MagicCardEightId", sql.Int, magicCardEightId)
        .input("CompanionCardOneId", sql.Int, companionCardOneId)
        .input("CompanionCardTwoId", sql.Int, companionCardTwoId)
        .input("CompanionCardThreeId", sql.Int, companionCardThreeId)
        .execute("spDeck_Add")
        .then((result) => {
          return res.send({ success: !!result.returnValue });
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

router.put(
  "/:deckId",
  authenticated,
  param("deckId").notEmpty().isNumeric(),
  body("name").notEmpty(),
  body("tagId").notEmpty().isNumeric(),
  body("echoId").notEmpty().isNumeric(),
  body("description").notEmpty(),
  body("magicCardOneId").notEmpty().isNumeric(),
  body("magicCardTwoId").notEmpty().isNumeric(),
  body("magicCardThreeId").notEmpty().isNumeric(),
  body("magicCardFourId").notEmpty().isNumeric(),
  body("magicCardFiveId").notEmpty().isNumeric(),
  body("magicCardSixId").notEmpty().isNumeric(),
  body("magicCardSevenId").notEmpty().isNumeric(),
  body("magicCardEightId").notEmpty().isNumeric(),
  body("companionCardOneId").notEmpty().isNumeric(),
  body("companionCardTwoId").notEmpty().isNumeric(),
  body("companionCardThreeId").notEmpty().isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const {
        deckId,
        name,
        tagId,
        echoId,
        description,
        magicCardOneId,
        magicCardTwoId,
        magicCardThreeId,
        magicCardFourId,
        magicCardFiveId,
        magicCardSixId,
        magicCardSevenId,
        magicCardEightId,
        companionCardOneId,
        companionCardTwoId,
        companionCardThreeId,
      } = matchedData(req);
      const isExplicit = isTextExplicit(name) || isTextExplicit(description);
      if (isExplicit) {
        return res
          .status(400)
          .send({ errors: ["Name / Description must not include profanity"] });
      }
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckId", sql.Int, deckId)
        .input("Name", sql.NVarChar(200), name)
        .input("TagId", sql.Int, tagId)
        .input("EchoId", sql.Int, echoId)
        .input("Description", sql.NVarChar(4000), description)
        .input("MagicCardOneId", sql.Int, magicCardOneId)
        .input("MagicCardTwoId", sql.Int, magicCardTwoId)
        .input("MagicCardThreeId", sql.Int, magicCardThreeId)
        .input("MagicCardFourId", sql.Int, magicCardFourId)
        .input("MagicCardFiveId", sql.Int, magicCardFiveId)
        .input("MagicCardSixId", sql.Int, magicCardSixId)
        .input("MagicCardSevenId", sql.Int, magicCardSevenId)
        .input("MagicCardEightId", sql.Int, magicCardEightId)
        .input("CompanionCardOneId", sql.Int, companionCardOneId)
        .input("CompanionCardTwoId", sql.Int, companionCardTwoId)
        .input("CompanionCardThreeId", sql.Int, companionCardThreeId)
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
        .input("DeckId", sql.Int, deckId)
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
        .input("DeckId", sql.Int, deckId)
        .input("CardId", sql.Int, cardId)
        .input("Position", sql.Int, position)
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
        .input("DeckCardId", sql.Int, deckCardId)
        .input("CardId", sql.Int, cardId)
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
        .input("DeckCardId", sql.Int, deckCardId)
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
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { deckId } = matchedData(req);
      const userId = req.userId;
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("DeckId", sql.Int, deckId)
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

router.delete(
  "/:deckId/vote",
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
        .input("DeckId", sql.Int, deckId)
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
