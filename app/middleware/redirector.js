var config = require('config');
var type = require('helper').type;

var INDEX = '/';
var AUTH = '/auth';
var CONTACT = '/contact';
var TERMS = '/terms';
var HELP = '/help';
var PRIVACY = '/privacy';
var MAINTENANCE = '/maintenance';
var ACCOUNT = '/account';
var CLIENTS = '/clients';
var PAY_SUBSCRIPTION = '/account/pay-subscription';
var ENABLE = '/account/enable';
var LOGOUT = '/account/log-out';
var DISABLED = '/account/disabled';

var STATIC = [CONTACT, HELP, TERMS, PRIVACY];

module.exports = function (req, res, next) {

  var user = req.user;

  // Allows requests to static files...
  if (req.path.indexOf('.') > -1) return next();

  function pathIs (path) {

    // We use indexOf instead of a simple comparison since
    // somethings we have a redirect query...
    if (type(path, 'string')) return req.originalUrl.indexOf(path) === 0;

    var paths = path;
    var match = false;

    paths.forEach(function(path){
      if (req.originalUrl.indexOf(path) === 0) match = true;
    });

    return match;
  }

  function pathIsNot (path) {
    return !pathIs(path);
  }

  // Make sure the user connects a Dropbox account to their blog
  if (pathIsNot([CLIENTS, LOGOUT, ACCOUNT]) && req.blog && !req.blog.client)
    return res.redirect(CLIENTS);

  if (pathIs(STATIC)) return next();

  // Only let the user see routes under account
  // if they don't have a blog yet.
  // Auth is not under the account route
  // so add it. It probably should be though.
  // We need the auth route to make the switch
  // dropbox feature work for accounts without blogs.
  if (!req.blog && pathIsNot([ACCOUNT, AUTH])) {
    return res.redirect(ACCOUNT);
  }

  // Don't expose any features which modify the database
  if (config.maintenance && pathIsNot(MAINTENANCE)) {
    return res.redirect(MAINTENANCE);
  }

  // Only serve the maintenance page if we are doing maintenance
  if (!config.maintenance && pathIs(MAINTENANCE)) {
    return res.redirect(INDEX);
  }

  // Only allow the user to pay
  if (user.needsToPay && pathIsNot(PAY_SUBSCRIPTION)) {
    return res.redirect(PAY_SUBSCRIPTION);
  }

  // Only let the user see these pages
  if (user.isDisabled && pathIsNot([ENABLE, LOGOUT, DISABLED])) {
    return res.redirect(DISABLED);
  }

  return next();
};