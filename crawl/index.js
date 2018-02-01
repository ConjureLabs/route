/*eslint no-sync: 0*/

const fs = require('fs');
const path = require('path');
const sortInsensitive = require('utils/Array/sort-insensitive');

const startingUnderscore = /^_/;
const startingDollarSign = /^\$/;
const jsFileExt = /\.js$/;

function syncCrawlRoutesDir(dirpath, uriPathTokens) {
  if (arguments.length === 2) {
    // at first call, only a directory path is given
    uriPathTokens = [];
  }

  const base = path.parse(dirpath).base;

  // root directories with a leading _ will still build out the route tree,
  // but the directory itself will not be included in the route path
  if (uriPathTokens.length > 0 || startingUnderscore.test(base) === false) {
    // adding to the tokens of the express route, based on the current directory being crawled
    // a folder starting with a $ will be considered a req param
    // (The : used in express does not work well in directory naming, and will mess up directory searching)
    uriPathTokens.push(base.replace(startingDollarSign, ':'));
  }

  const list = fs.readdirSync(dirpath);
  const routes = [];
  const files = [];

  sortInsensitive(list);

  for (let i = 0; i < list.length; i++) {
    const stat = fs.statSync(path.resolve(dirpath, list[i]));

    if (stat.isFile() && jsFileExt.test(list[i])) {
      files.push(list[i]);
      continue;
    }

    if (stat.isDirectory()) {
      const subdirRoutes = syncCrawlRoutesDir(path.resolve(dirpath, list[i]), uriPathTokens.slice());

      for (let j = 0; j < subdirRoutes.length; j++) {
        routes.push(subdirRoutes[j]);
      }
    }
  }

  for (let i = 0; i < files.length; i++) {
    const verb = files[i].replace(jsFileExt, '').toLowerCase();

    if (!validVerbs.includes(verb)) {
      continue;
    }

    const individualRoute = require(path.resolve(dirpath, files[i]));
    routes.push(individualRoute.expressRouter(verb, '/' + uriPathTokens.join('/')));
  }
  
  return routes;
}
