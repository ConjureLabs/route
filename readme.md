[![CircleCI](https://circleci.com/gh/ConjureLabs/route/tree/master.svg?style=svg)](https://circleci.com/gh/ConjureLabs/route/tree/master)

This library walks a directory and turns it into express routes.

The current version requires express >= 5, so that async handlers are supported.

## Install

```sh
npm install @conjurelabs/route
```

or

```sh
yarn add @conjurelabs/route
```

## Usage

Let's say you have your routes in a directory like:

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

Note that params are defined with a `$`, not a `:`. Colons cause issues when searching, in editors.

Each file just needs to export an express route handler, like:

```js
module.exports = (req, res, next) => {
  res.send('result')
}
```

You can walk them, and mount them on your express server:

```js
const routes = await walkRoutes(path.resolve(__dirname, 'routes'))
const server = express()
server.use(routes)
```

### Middleware

You can add middleware methods in a `.middleware` directory. All neighbor routes will inherit these methods.

They are enabled on subroutes via a `.middleware.flags.js` file.

```
.
└── routes
    ├── .middleware
    │   ├── requireLoggedIn.js
    │   └── appendSession.js
    └── account
        ├── .middleware.flags.js
        ├── $accountId
        │   ├── delete.js
        │   ├── get.js
        │   ├── patch.js
        │   ├── post.js
        │   └── put.js
        └── all.js
```

In this example, if `.middleware.flags.js` is set to:

```js
module.exports = {
  requireLoggedIn: true,
  appendSession: false
}
```

This will only implement the `requireLoggedIn` middleware.

#### Route-Exported Middleware Flags

If you need to set middleware flags on a specific route, you can do so:

```js
module.exports = (req, res) => {
  res.send('some route')
}

module.exports.middlewareFlags = {
  appendSession: true
}
```

#### Middleware Flag Resolution

Flags are resolved bottom-up. Route-exported flags come first, then flags set in `.middleware.flags.js` files, going upward in the directory.

#### Middleware skipping

If you want a middleware method to not call `next()`, but to skip over _all_ subroutes, you can call a fourth `skip` argument. This only supported in middleware methods.

```js
const requireLoggedIn = (req, res, next, skip) => {
  if (!req.user.id) {
    return skip()
  }
  next()
}
module.exports = requireLoggedIn
```
