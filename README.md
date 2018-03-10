## Route

This class is meant to help working with [Express](https://expressjs.com/) routes.

Instead of creating a hodgepodge of oddly organized files, containing an assortment of route handlers, you should organize all routes within one root directory, where the directory structure within define the route path. It makes it clear to developers, as well as helps developers make better decisions when creating a new route, for a given resource.

Express route handlers are pushed into a `Route` instance. `Route` is a class that extends `Array`.

The route verbs will be gathered from the filenames (like `get.js` or `patch.js`). You can also use `all.js` which will match any verb to the route.

```js
const Route = require('@conjurelabs/route')

const route = new Route()

route.push(async (req, res) => {
  return res.send('hello world')
})

module.exports = route
```

### Install

```sh
npm install --save @conjurelabs/route
```

or

```sh
yarn add @conjurelabs/route
```

### Async vs Callbacks

You can use either. Callbacks are pretty straight-forward.

```js
route.push((req, res, next) => {
  // res.send() or next()
})
```

With `async`, if you do not `return`, then it's equivalent to calling `next()` in a callback route.

```js
route.push(async (req, res) => {
  return res.send('hello world')
})
```

```js
route.push(async (req, res) => {
  // no return, will imply next()
})
```

The following will result in a headers re-sent error. You **must** `return` with `res.send()` in an `async` handler. If you do not `return` it will imply a `res.send()` and _then_ `next()`, which will likely hit your 404 handler, and result in a double response.

```js
// do not do this
route.push(async (req, res) => {
  res.send('improper response')
  // will call next(), causing a bug
})
```

### Routes Structure

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
        └── all.js
```

This is a simple example with only one root resource (`account`).

You can get the Express router object, for any individual route.

```js
const accountCreation = require('./routes/account/$accountId/post.js')
const router = accountCreation.expressRouter('post', '/account/:accountId')
```

This is useful if you want to handle things directly, but most likely you want to get _all the routes_ within the root routes directory.

**The crawl logic is uses `sync` logic.** The idea is that it should be used at initial setup of a server, where a blip of sync logic is acceptable, but typically not after that.

```js
const crawl = require('@conjurelabs/route/sync-crawl')
const path = require('path')
const routesDir = path.resolve(__dirname, 'routes')

const apiRoutes = crawl(routesDir)

// now you can simply pass all the routes into Express
server.use(apiRoutes)

/*
  routes now available:
    - *       /account
    - DELETE  /account/:accountId
    - GET     /account/:accountId
    - PATCH   /account/:accountId
    - POST    /account/:accountId
    - PUT     /account/:accountId
 */
```

Note that the initial directory (in this case `./routes`) does not add the Express route paths.

### Options

#### Require Authentication

If you want a route to only be accessible if the user is authenticated (based on Express' `req.isAuthenticated()`), then use:

```js
const route = new Route({
  requireAuthentication: true
})
```

Note that the default behavior is to not restrict access. But if you want to be explicit, you can set `requireAuthentication` to `false`:

```js
const route = new Route({
  requireAuthentication: false
})
```

#### Blacklisted Env Vars

If you want to block a route from being using when an ENV var is set, you can do so like:

```js
const route = new Route({
  blacklistedEnv: {
    NODE_ENV: ['test', 'production']
  }
})

route.push(async (req, res) => {
  // this will not be accessible if process.env.NODE_ENV is 'test' or 'production'
})

module.exports = route
```

This is useful for setting up debug endpoints that should only be used in development.

#### Wildcard

If you want to catch-all (e.g. `/some/route/*` instead of `/some/route`) then you can set `wildcard: true`.

```js
const route = new Route({
  wildcard: true
})

route.push(async (req, res) => {
  // ...
})

module.exports = route
```

#### Skipped Handler

If a route is skipped, because of invalid criteria like not passing the `requireAuthentication` check, then it will, by default, continue through the Express routes matching the path. To override that, you can supply `skippedHandler`.

```js
const route = new Route({
  requireAuthentication: true,
  skippedHandler: async (req, res) => {
    // ...
  }
})

route.push(async (req, res) => {
  // if this route is not executed, because the user is not authed,
  // then `skippedHandler` will be called instead of this or any later handlers
})
```

This can be used to force 404s.

#### CORS

If you need to use cross-origin routes, you can pass `cors` in the initial config. Any options will be passed on to the [Express cors module](https://github.com/expressjs/cors#readme), so check out their readme for any further details.

```js
const route = new Route({
  cors: {
    credentials: true,
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
    optionsSuccessStatus: 200,
    origin: [
      config.web.origin
    ]
  }
})
```

#### Changing Default Options

If you have something like CORS, and want every endpoint to have those options, instead of sending them to each constructor, you can modify the default `Route` options before initializing any routes.

```js
Route.defaultOptions = {
  cors: {}
}
```

This example will override _only_ the `cors` attribute in the default options, leaving others unchanged.

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
  const getOrgsApi = require('api-repo/routes/orgs/get.js')

  const result = await getOrgsApi.call(req, { arg: 'val' })

  // ...
})
```

This expects direct calls to be from within another express route handler. The first argument to `.call()` needs to be an express `req` object. The second (optional) arg is the req query or body.

If a route you are trying to call directly has req params, you can set them via a third argument.

```js
// this is assumed to be within a parent repo
route.push(async (req, res) => {
  const getOrgInfoApi = require('api-repo/routes/org/$orgName/info/get.js')

  const result = await getOrgInfoApi.call(req, {}, { orgName: 'myOrg' })

  // ...
})
```

It is possible that the `.call` callback will not receive any data, if the route itself returns null, and `res.send` is never fired.
