var compression = require("compression");
var middleware = require("middleware");
var bodyParser = require("body-parser");
var hogan = require("hogan-express");
var express = require("express");
var debug = require('debug')('dashboard');

var VIEW_DIRECTORY = __dirname + "/views";

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Send static files
dashboard.use('/css', express.static(VIEW_DIRECTORY + "/css"));
dashboard.use('/images', express.static(VIEW_DIRECTORY + "/images"));
dashboard.use('/scripts', express.static(VIEW_DIRECTORY + "/scripts"));

// Log response time in development mode
dashboard.use(function(req, res, next){
  
  debug(req.originalUrl, 'recieved request');

  var start = Date.now();

  res.on('finish', function() {
    var duration = Date.now() - start;
    debug(req.originalUrl, 'response sent in', duration);
  });

  next();
});

// Logs the time spent rendering each page
dashboard.use(middleware.responseTime);

// Enable GZIP
dashboard.use(compression());

// Hide the header which says the app
// is built with Express
dashboard.disable("x-powered-by");

// Without trust proxy is not set, express
//  will incorrectly register the proxy’s IP address
// as the client IP address unless trust proxy is configured.
dashboard.set("trust proxy", "loopback");

// Register the engine we will use to
// render the views.
dashboard.set("view engine", "html");
dashboard.set("views", VIEW_DIRECTORY);
dashboard.engine("html", hogan);

// For when we want to cache templates
if (process.env.BLOT_ENVIRONMENT !== "development") {
  dashboard.enable("view cache");
}

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
dashboard.locals.cacheID = Date.now();

// Special function which wraps render
// so there is a default layout and a partial
// inserted into it
dashboard.use(require("./render"));

// Appends a one-time CSRF-checking token
// for each GET request, and validates this token
// for each POST request, using csurf. 
dashboard.use(require('./csrf'));

// Used for passing success / error messages
// around using the session property of each
// request instead of a query string
dashboard.use(middleware.messenger);

dashboard.use(function(req, res, next){
  debug(req.originalUrl, 'before load');
  next();
});

// Load properties as needed
// these should not be invoked for requests to static files
dashboard.use(middleware.loadUser);
dashboard.use(middleware.loadBlog);

// Performs some basic checks about the
// state of the user's blog, user's subscription
// and shuttles the user around as needed
dashboard.use(middleware.redirector);

dashboard.use(function(req, res, next){
  debug(req.originalUrl, 'after load');
  next();
});


// Account page does not need to know about the state of the folder
// for a particular blog
require("./routes/account")(dashboard);




dashboard.post(
  ["/theme*", "/path", "/folder*", "/clients*", "/flags", "/404s", "/account*"],
  bodyParser.urlencoded({ extended: false })
);

dashboard.use(function(req, res, next){
  debug(req.originalUrl, 'before folder');
  next();
});

// Load the files and folders inside a blog's folder
dashboard.use(require("./routes/folder"));

dashboard.use(function(req, res, next){
  debug(req.originalUrl, 'after folder');
  next();
});

dashboard.use(function(req, res, next){
  debug(req.originalUrl, 'third middleware here');
  next();
});

require("./routes/settings")(dashboard);

require("./routes/clients")(dashboard);
require("./routes/editor")(dashboard);
require("./routes/theme")(dashboard);
require("./routes/tools")(dashboard);

// need to handle dashboard errors better...
dashboard.use(require('./routes/error'));

module.exports = dashboard;
