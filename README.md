## Route

This class is meant to help working with [Express](https://expressjs.com/) routes.

Instead of creating a hodgepodge of oddly organized files, containing an assortment of route handlers, you should organize all routes within one root directory, where the directory structure within define the route path. It makes it clear to developers, as well as helps developers make better decisions when creating a new route, for a given resource.

Express route handlers are pushed into a `Route` instance. `Route` is a class that extends `Array`.

The route verbs will be gathered from the filenames (like `get.js` or `patch.js`).

```js
const Route = require('route');

const route = new Route();

route.push(async (req, res) => {
  // either res.send or return
});

module.exports = route;
```

### Routes Setup

Routes need to be within a directory.

Let's say your repo, `api` has a `routes` directory.

```
.
└── routes
    └── account
        ├── $accountId
        │   ├── delete.js
        │   ├── get.js
        │   ├── patch.js
        │   ├── post.js
        │   └── put.js
        └── get.js
```

This is a simple example with only one root resource (`account`).

### Options

#### Require Authentication

If you want a route to only be accessible if the user is authenticated (based on Express' `req.isAuthenticated()`), then use:

```js
const route = new Route({
  requireAuthentication: true
});
```

#### Blacklisted Env Vars

If you want to block a route from being using when an ENV var is set, you can do so like:

```js
const route = new Route({
  blacklistedEnv: {
    NODE_ENV: ['test', 'production']
  }
});

route.push(async (req, res) => {
  // this will not be accessible if process.env.NODE_ENV is 'test' or 'production'
});

module.exports = route;
```

This is useful for setting up debug endpoints that should only be used in development.

#### Wildcard

If you want to catch-all (e.g. `/some/route/*` instead of `/some/route`) then you can set `wildcard: true`.

```js
const route = new Route({
  wildcard: true
});

route.push(async (req, res) => {
  // ...
});

module.exports = route;
```

#### Skipped Handler

If a route is skipped, because of invalid criteria like not passing the `requireAuthentication` check, then it will, by default, continue through the Express routes matching the path. To override that, you can supply `skippedHandler`.

```js
const route = new Route({
  requireAuthentication: true,
  skippedHandler: async (req, res) => {
    // ...
  }
});

route.push(async (req, res) => {
  // if this route is not executed, because the user is not authed,
  // then `skippedHandler` will be called instead of this or any later handlers
});
```

This can be used to force 404s.

### Child Overrides

#### Modifying route before passing to Express

You can alter anything within the `this` namespace (including the handlers, since it is an array) by creating a child class that extends `Route`, and providing an override method for `expressRouterPrep`.

`expressRouterPrep` is called at the start of `expressRouter`.

By overriding this method you can add any route mutation logic before the full route tree is constructed.

### Server-side Calls

Let's say you have an API repo. And a server running that, so that your web server can call it.

And then within the web repo, you have some backend code that needs to access the API. You can have your backend make an HTTP request to the API server, which is okay, but it involves an additional hop, which adds overhead to the overall request.

Alternatively, you can install the API repo as a module into your web repo (if you are not super opposed to that idea) and then access the API route handlers directly, as function calls, via `.call(req, args)`. This means your web repo would fire the API logic directly, avoiding that extra hop, and avoiding duplicating code as well. The caveat here is that you would have to upgrade the API module within your web repo, as needed.

```js
// this is assumed to be within a parent repo
route.push(async (req, res) => {
  const getOrgsApi = require('api-repo/routes/orgs/get.js');

  const result = await getOrgsApi.call(req, { arg: 'val' });

  // ...
});
```

This expects direct calls to be from within another express route handler. The first argument to `.call()` needs to be an express `req` object. The second (optional) arg is the req query or body.

If a route you are trying to call directly has req params, you can set them via a third argument.

```js
// this is assumed to be within a parent repo
route.push(async (req, res) => {
  const getOrgInfoApi = require('api-repo/routes/org/$orgName/info/get.js');

  const result = await getOrgInfoApi.call(req, {}, { orgName: 'myOrg' });

  // ...
});
```

It is possible that the `.call` callback will not receive any data, if the route itself returns null, and `res.send` is never fired.
