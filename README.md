## Route

[![CircleCI](https://circleci.com/gh/ConjureLabs/route/tree/master.svg?style=svg)](https://circleci.com/gh/ConjureLabs/route/tree/master)

This class is meant to help working with [Express](https://expressjs.com/) routes.

Instead of creating a hodgepodge of oddly organized files, containing an assortment of route handlers, you should organize all routes within one root directory, where the directory structure within define the route path. It makes it clear to developers, as well as helps developers make better decisions when creating a new route, for a given resource.

Express route handlers are pushed into a `Route` instance. `Route` is a class that extends `Array`.

The route verbs will be gathered from the filenames (like `get.js` or `patch.js`). You can also use `all.js` which will match any verb to the route.

```js
const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  res.send('hello world')
})

module.exports = route
```

### Install

```sh
npm install @conjurelabs/route
```

or

```sh
yarn add @conjurelabs/route
```

### Async vs Normal Handlers

Exprss supports `async` routes, which works nearly the same way as a normal function.

```js
// normal
route.push((req, res, next) => {
  // res.send() or next()
})

// async
route.push(async (req, res, next) => {
  // res.send() or next()
})
```

Normally you'd need to wrap `await`s with `try {} catch {}`, and pass errors to `next()` manually.

This library auto-wraps `async` functions and passes errors directly to `next` for you.

```js
route.push(async (req, res) => {
  throw new Error('Some kind of error occurred')

  // next(err) will be called, and the rest of the flow will stop

  res.send('result') // this will not be reached
})
```

### Mounting routes in Express

Each `Route` instance has a helper which converts the route handlers into a proper Express router.

```js
const routeInstance = require('./my-route')

const router = routeInstance.expressRouter('get', '/my/route/path')

server.use(router)
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

**The crawl logic is `sync`.** The idea is that it should be used at initial setup of a server, where a blip of sync logic is acceptable, but typically not after that.

```js
const { syncCrawl } = require('@conjurelabs/route')
const path = require('path')
const routesDir = path.resolve(__dirname, 'routes')

const apiRoutes = syncCrawl(routesDir)

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

You can also define your own verb mapping, if you want to use filenames other than `get` or `post`.

Do not include file extensions (`.js`) in the values to match against.

```js
const apiRoutes = syncCrawl(routesDir, {
  verbs: {
    get: 'route.get',
    post: 'route.post',
    patch: 'route.patch',
    put: 'route.put',
    delete: 'route.delete'
  }
})
```

This can also handle expressions, as well as limit what verbs are available

```js
const apiRoutes = syncCrawl(routesDir, {
  verbs: {
    get: /get-\.+/i,    // can match 'get-xyz.js'
    post: 'route.post'  // only matches 'route.post.js'
                        // no other verbs are exposed
  }
})
```

These will still honor numbering. `'route.post'` can match `'route.post-0.js'`

#### Exporting Functions

When using `syncCrawl`, you will be able to export direct functions, or array of functions, to be used as route handlers. These will be auto-converted to `Route` instances.

```js
module.exports = (req, res) => res.send('hello world')
```

#### URL Params

If you have a directory like `/$accountName` in your routes path, it will be accessible via `req.params` just as you would normally expect in Express.

```js
route.push(async (req, res) => {
  const { accountName } = req.params
  // ...
})
```

#### Debugging Crawled Routes

You can enable debugging of `syncCrawl` by setting the env var `DEBUG=route:syncCrawl` (or `=*` for all [debug](https://www.npmjs.com/package/debug) output).

This will list all applied routes, and what files will handle the calls.

#### Serial handlers

You can also add multiple files for the same verb. Add a number to each file to order them, ascending. Any files without a number (e.g. `get.js`) will be the final handler in that case.

```
.
└── routes
    └── account
        └── $accountId
            ├── get.0.js    # fired first
            ├── get.1.js
            ├── get.99.js
            └── get.js      # fired last
```

#### Order of Execution

Assume you have the following structure:

```
.
└── routes
    ├─── account
    │   ├── me
    │   │   └── get.js
    │   └── $accountId
    │       ├── all.js
    │       └── get.js
    └── get.js (wildcard)
```

Here's what handlers are processed, in order:

`GET /routes`:
  - `/routes/get.js (wildcard)`

`GET /routes/account/me`:
  - `/routes/get.js (wildcard)`
  - `/routes/account/me/get.js`

`GET /routes/account/1234`:
  - `/routes/get.js (wildcard)`
  - `/routes/account/all.js`
  - `/routes/account/get.js`

1. wildcard handlers are hoisted to the top of their scope
2. directories with specific names (like `/me`) are hoisted above those using params (like `/$accountId`)
3. `all` handlers are hoisted above more-specific handlers (like `get`)

#### file handling

In the case that a file is crawled, but does not return a `Route` instance, it will normally throw. You can provide a `fileHandler` function to the crawler, which takes in the file exports and should return a `Route` instance.

This can be used to support something like a React component without having to wrap it all in repeaditive `Route` scaffolding.

```js
const apiRoutes = syncCrawl(routesDir, {
  fileHandler: content => {
    const route = new Route()
    route.push((req, res) => {
      res.render(content)
    })
    return route
  }
}
```

This will not apply to files that return a `Route` instance.

It also receives some extra context of the file being handled.

```js
fileHandler: (content, {
  filename,   // e.g. 'get.js'
  routePath,  // path used to require file
  verb        // e.g. 'get'
}) => { ... }
```

### Config Options

Route instances take in a hash of configuration options, which apply route handlers.

```js
const route = new Route({
  // ...
})
```

You can also set these in `routes.json` or `routes.js` files in the route tree. Configuration is resolved, and any inline configuration will override resolved values.

```
.
└── routes
    ├─── routes.json      # { a: 123 }
    ├─── account
    │   ├── routes.json   # { b: 456 }
    │   ├── get.js
    └── get.js (wildcard)
```

In this example, where `/routes/get.js` has `new Route()`, it will have a resolved config of `{ a: 123 }`,

In `/routes/account/get.js` where `new Route({ a: 789 })` has an inline config, the instance will have a resolved config of `{ a: 789, b: 456 }`.

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

#### Custom Handlers

You can define custom handlers that will become available with any new `Route` instance.

```js
// making `requireApiToken` available on route instances
// this will be available in any file that uses `Route`
Route.handlers = {
  requireApiToken: (req, res, next) => {
    const { token } = req.query
    const validToken = await getUserToken(req)

    if (token !== validToken) {
      return next(new Error('Must pass valid user token'))
    }

    next()
  }
}

// setting up a route that uses the new api token logic
const route = new Route({
  requireApiToken: true
})

// this handler will only fire if api token handler succeeds
route.push((req, res, next) => {
  res.send('sensitive info')
})
```

You can also define custom arguments to a handler, that are passed per each route.

```js
// making `requireApiToken` available on route instances
// this will be available in any file that uses `Route`
Route.handlers = {
  requireApiToken: (req, res, next, args) => {
    const { token } = req.query
    const { tokenBlacklist } = args
    const validToken = await getUserToken(req)

    if (token !== validToken || tokenBlacklist.includes(token)) {
      return next(new Error('Must pass valid user token'))
    }

    next()
  }
}

const tokenBlacklist = ['asdf123']

// setting up a route that uses the new api token logic
const route = new Route({
  requireApiToken: tokenBlacklist
})

// this handler will only fire if api token handler succeeds
route.push((req, res, next) => {
  res.send('sensitive info')
})
```

If the handler is enabled via `true` then the handler will not receive any args.

If you want a handler to be `true` in every route instance, by default, you can add it to `Route.defaultOptions`

```js
Route.defaultOptions = {
  requireApiToken: true
}
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

### Copying a route instance

It's easy to copy a route.

```js
const myRoute = require('./routes/my-route/get.js')
const copy = myRoute.copy

// allows you to modify the copy
copy.unshift(async (req, res, next) => {
  // ...
})

module.exports = copy
```
