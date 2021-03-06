const dotenv = require("dotenv").config({
  silent: process.env.NODE_ENV === "production"
});

const package = require("./package.json");
const debug = require("debug")(`${package.name}:index`);
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const helmet = require("helmet");
const express_enforces_ssl = require("express-enforces-ssl");
const session = require('cookie-session');
const OktaMiddleware = require('@financial-times/okta-express-middleware');

const bodyParser = require('body-parser');
// support parsing of application/json type post data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


if (process.env.NODE_ENV === "production") {
  app.use(helmet());
  app.enable("trust proxy");
  app.use(express_enforces_ssl());

  const googleTokenPath = path.resolve(`${__dirname}/keyfile.json`);
  fs.writeFileSync(googleTokenPath, process.env.GOOGLE_CREDS);
}

const articles = require("./routes/articles");
const twentyfourhrs = require("./routes/twentyfourhrs");
const facetHistory = require("./routes/facetHistory");
const lantern = require("./routes/lantern");
const list = require("./routes/list");
const timeline = require("./routes/timeline");
const facetsWithArticles = require("./routes/facetsWithArticles");
const heartbeat = require("./routes/heartbeat");
const hierarchicalEdgeBundling = require("./routes/hierarchicalEdgeBundling");
const tinder = require("./routes/tinder");
const spaceUtilisation = require("./routes/spaceUtilisation");
const ftMaps = require("./routes/ftMaps");
const ftabulous = require("./routes/ftabulous");
const searchAndContent = require("./routes/searchAndContent");
const ame = require("./routes/aggregatedMetadataExperiments");
const hbs = require("hbs");
const year = require("./routes/year");

hbs.registerPartials(path.resolve(__dirname + '/views/partials/'));

hbs.registerHelper("imgPath", function(path) {
  return path.split("?")[0] + "?source=search";
});

hbs.registerHelper("json", function(context) {
  return JSON.stringify(context);
});

// view engine setup
app.set("views", path.resolve(path.join(__dirname, 'views')));
app.set("view engine", "hbs");

let requestLogger = function(req, res, next) {
  debug("RECEIVED REQUEST:", req.method, req.url);
  next(); // Passing the request to the next handler in the stack.
};

const okta = new OktaMiddleware({
  client_id: process.env.OKTA_CLIENT,
  client_secret: process.env.OKTA_SECRET,
  issuer: process.env.OKTA_ISSUER,
  appBaseUrl: process.env.BASE_URL,
  scope: 'openid offline_access name'
});

app.use(session({
	secret: process.env.SESSION_TOKEN,
	maxAge: 24 * 3600 * 1000, //24h
	httpOnly: true
}));

app.use(requestLogger);

// these routes do *not* have OKTA
app.use("/static", express.static((path.resolve(__dirname + '/static'))));

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  throw new Error("ERROR: TOKEN not specified in env");
}

// these route *do* use OKTA
app.set("json spaces", 2);


// Check for valid OKTA login or valid token to byass OKTA login
// This function is not in a middleware or seperate file because
// it requires the context of okta and app.use to function
app.use((req, res, next) => {
  if ('token' in req.headers){
	   if(req.headers.token === process.env.TOKEN){
		     debug(`Token (header) was valid.`);
		     next();
       } else {
         debug(`The token (header) value passed was invalid.`);
         res.status(401);
         res.json({
           status : 'err',
           message : 'The token (header) value passed was invalid.'
         });
       }
  } else if('token' in req.query ){
    if(req.query.token === process.env.TOKEN){
      debug(`Token (query string) was valid.`);
		  next();
    } else {
      debug(`The token (query) value passed was invalid.`);
      res.status(401);
      res.json({
        status : 'err',
        message : 'The token (query) value passed was invalid.'
      });
    }
  } else {
    debug(`No token in header or query, so defaulting to OKTA`);
		// here to replicate multiple app.uses we have to do
		// some gross callback stuff. You might be able to
    // find a nicer way to do this

		// This is the equivalent of calling this:
		// app.use(okta.router);
		// app.use(okta.ensureAuthenticated());
    // app.use(okta.verifyJwts());

		okta.router(req, res, error => {
			if (error) {
				return next(error);
      }
			okta.ensureAuthenticated()(req, res, error => {
				if (error) {
					return next(error);
        }
				okta.verifyJwts()(req, res, next);
      });
    });
  }
});

app.use("/articles/", articles);
app.use("/24hrs/", twentyfourhrs);
app.use("/facethistory/", facetHistory);
app.use("/lantern/", lantern);
app.use("/list/", list);
app.use("/timeline/", timeline);
app.use("/facetsWithArticles/", facetsWithArticles);
app.use("/heartbeat/", heartbeat);
app.use("/hierarchicalEdgeBundling/", hierarchicalEdgeBundling);
app.use("/tinder/", tinder);
app.use("/space/", spaceUtilisation);
app.use("/ftMaps/", ftMaps);
app.use("/ftabulous/", ftabulous);
app.use("/ame/", ame);
app.use("/searchAndContent/", searchAndContent);
app.use("/year/", year);

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
