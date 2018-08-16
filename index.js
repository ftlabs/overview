const dotenv = require("dotenv").config({
  silent: process.env.NODE_ENVIRONMENT === "production"
});

const package           = require("./package.json");
const debug             = require("debug")(`${package.name}:index`);
const s3o               = require('@financial-times/s3o-middleware');
const express           = require("express");
const path              = require("path");
const app               = express();
const validateRequest   = require("./helpers/check-token");
const articles          = require("./routes/articles");
const twentyfourhrs     = require("./routes/twentyfourhrs");
const facetHistory      = require("./routes/facetHistory");
const lantern           = require("./routes/lantern");

const hbs = require("hbs");

hbs.registerPartials(__dirname + "/views/partials");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

var requestLogger = function(req, res, next) {
  debug("RECEIVED REQUEST:", req.method, req.url);
  next(); // Passing the request to the next handler in the stack.
};

app.use(requestLogger);

// these routes do *not* have s3o
app.use("/static", express.static("static"));

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  throw new Error("ERROR: TOKEN not specified in env");
}

// these route *do* use s3o
app.set("json spaces", 2);
if (process.env.BYPASS_TOKEN !== "true") {
  app.use(validateRequest);
}

//Core Routes
app.use("/articles", articles);
app.use("/24hrs", twentyfourhrs);
app.use("/facethistory", facetHistory);
app.use("/lantern", lantern);

// ---

app.use("/", (req, res) => {
  res.render("index");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("ERROR: PORT not specified in env");
}

const server = app.listen(PORT, function() {
  console.log("Server is listening on port", PORT);
});

module.exports = server;
