import express from "express";
import sql from "mssql";
import { validationResult, matchedData, param, body } from "express-validator";
import { Errors } from "../types";
import { logError, isTextExplicit } from "../helpers";
import { authenticated } from "../middleware";

const router = express.Router();

router.put(
  "/",
  authenticated,
  body("nickname").notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { nickname } = matchedData(req);
      const userId = req.userId;
      const isExplicit = isTextExplicit(nickname);
      if (isExplicit) {
        return res
          .status(400)
          .send({ errors: ["Username must not include profanity"] });
      }
      req.db
        .request()
        .input("Auth0Id", sql.NVarChar(200), userId)
        .input("Nickname", sql.NVarChar(200), nickname)
        .execute<Record<string, unknown>[]>("spProfile_Update")
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

router.get("/", authenticated, (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const auth0Id = req.userId;
    req.db
      .request()
      .input("Auth0Id", sql.NVarChar(200), auth0Id)
      .execute<Record<string, unknown>[]>("spProfile_Get")
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
});

export default router;
