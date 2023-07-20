import express from "express";
import sql from "mssql";
import helmet from "helmet";
import { auth } from "express-oauth2-jwt-bearer";
import { addUserId, errorHandler } from "./middleware";
import bodyParser from "body-parser";
import deck from "./routes/deck";
import card from "./routes/card";
import category from "./routes/category";
import echo from "./routes/echo";
import tag from "./routes/tag";
import profile from "./routes/profile";
import userRoute from "./routes/user";

const app = express();

const port = process.env.PORT ?? 8080;

const audience = process.env.Audience;
const issuerBaseURL = process.env.IssuerBaseURL;
const server = process.env.Server;
const database = process.env.Database;
const user = process.env.User;
const password = process.env.Password;

if (!server || !database || !user || !password || !audience || !issuerBaseURL) {
  console.error("env vars missing");
  throw Error();
}

const jwtCheck = auth({
  authRequired: false,
  audience,
  issuerBaseURL,
  tokenSigningAlg: "RS256",
});

// middleware
app.use(helmet());
app.use(jwtCheck);
app.use(bodyParser.json());
app.use(addUserId);

const appPool = new sql.ConnectionPool({
  user,
  password,
  server,
  database,
});

appPool
  .connect()
  .then(function (pool) {
    app.use((req, res, next) => {
      req.db = pool;
      next();
    });

    // routes
    app.use("/deck", deck);
    app.use("/card", card);
    app.use("/category", category);
    app.use("/echo", echo);
    app.use("/tag", tag);
    app.use("/profile", profile);
    app.use("/user", userRoute);

    // error handling
    app.use(errorHandler);

    app.listen(port, function () {
      console.log("listening on port", port);
    });
  })
  .catch(function (err) {
    console.error(err);
    console.error("Error connecting to DB");
  });
