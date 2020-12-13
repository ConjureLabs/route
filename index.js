const fs = require('fs').promises
const path = require('path')
const express = require('express')

const jsExtensionExpr = /\.js$/
const preDotExpr = /^[^\.]+/
const validHandlerVerbs = ['all', 'get', 'post', 'put', 'patch', 'delete']

class RouterDefinition {
  constructor({ baseDir, dir, filename, verb, methods }) {
    // adding to the tokens of the express route, based on the current directory being crawled
    // a folder starting with a $ will be considered a req param
    // (The : used in express does not work well in directory naming, and will mess up directory searching)
    this.routerPath = path.relative(baseDir, dir).replace(/^\/?/, '/').replace(/\/\$/, '/:')
    this.filename = filename
    this.verb = verb
    this.methods = methods
    this.depth = this.routerPath.split('/').length
  }

  addRoute(router) {
    router[this.verb](this.routerPath, ...this.methods)
  }
}

// attributes -> { flags: { [key]: bool }, middleware: { [key]: function } }
// all objects are flat
async function walkDir(baseDir, dir, attributes) {
  const dirDirents = await fs.readdir(dir, { withFileTypes: true })
  let flags, fusedFlags
  let middleware, fusedMiddleware
  let subdirs = []
  const handlers = []

  for (let i = 0; i < dirDirents.length; i++) {
    const dirent = dirDirents[i]
    const type = direntType(dirent)

    switch (type) {
      case 'dir':
        subdirs.push(dirent.name)
        break

      case 'handler':
        handlers.push(dirent.name)
        break

      case 'flags':
        flags = require(path.resolve(dir, dirent.name))
        break

      case 'middleware':
        middleware = await walkMiddleware(path.resolve(dir, dirent.name))
        break
    }
  }

  if (!handlers.length && !subdirs.length) {
    return []
  }

  if (flags) {
    fusedFlags = { ...attributes.flags, ...flags }
  }

  if (middleware) {
    fusedMiddleware = { ...attributes.middleware, ...middleware }
  }

  if (subdirs) {
    subdirs = subdirs.map(subdir => walkDir(
      baseDir,
      path.resolve(dir, subdir),
      {
        flags: fusedFlags || attributes.flags,
        middleware: fusedMiddleware || attributes.middleware
      }
    ))
  }

  const routerDefs = []
  for (let i = 0; i < handlers.length; i++) {
    const verbMatch = handlers[i].match(preDotExpr)
    const verb = verbMatch[0].toLowerCase()
    routerDefs.push(
      new RouterDefinition({
        baseDir,
        dir,
        filename: handlers[i],
        verb,
        methods: routeMethods(require(path.resolve(dir, handlers[i])), fusedMiddleware || attributes.middleware, fusedFlags || attributes.flags)
      })
    )
  }

  subRouterDefs = await Promise.all(subdirs)
  const results = [ ...routerDefs ]
  for (let i = 0; i < subRouterDefs.length; i++) {
    results.push(...subRouterDefs[i])
  }
  return results
}

function routeMethods(handler, middleware, flags) {
  const fusedFlags = handler.middlewareFlags ? { ...flags, ...handler.middlewareFlags } : flags
  const methods = []

  const prep = (req, res, next) => {
    req.__routeContext = { skip: false }
    next()
  }

  methods.push(prep)

  for (let key in fusedFlags) {
    if (!fusedFlags[key]) {
      continue
    }

    if (!middleware[key]) {
      continue
    }

    const resultMiddleware = Array.isArray(middleware[key]) ?
      middleware[key].map(individualMiddleware => wrappedRouteHandler(individualMiddleware, true)) :
      [wrappedRouteHandler(middleware[key], true)]
    methods.push(...resultMiddleware)
  }

  const resultHandlers = Array.isArray(handler) ?
    handler.map(individualHandler => wrappedRouteHandler(individualHandler, false)) :
    [wrappedRouteHandler(handler, false)]
  methods.push(...resultHandlers)

  return methods
}

function wrappedRouteHandler(handler, withSkip) {
  const isAsync = handler.constructor.name === 'AsyncFunction'

  return async (req, res, next) => {
    if (req.__routeContext.skip) {
      return next()
    }

    if (withSkip) {
      const skipMethod = () => {
        req.__routeContext.skip = true
        next()
      }

      if (isAsync) {
        await handler(req, res, next, skipMethod)
      } else {
        handler(req, res, next, skipMethod)
      }
    } else {
      if (isAsync) {
        await handler(req, res, next)
      } else {
        handler(req, res, next)
      }
    }
  }
}

async function walkMiddleware(dir) {
  const dirDirents = await fs.readdir(dir, { withFileTypes: true })
  const middleware = {}

  for (let i = 0; i < dirDirents.length; i++) {
    const dirent = dirDirents[i]

    if (dirent.isFile() && jsExtensionExpr.test(dirent.name)) {
      middleware[dirent.name.replace(jsExtensionExpr, '')] = require(path.resolve(dir, dirent.name))
    }
  }

  return middleware
}

// can return undefined
function direntType(dirent) {
  if (dirent.isFile()) {
    if (dirent.name === '.middleware.flags.js') {
      return 'flags'
    }
    if (jsExtensionExpr.test(dirent.name)) {
      const verbMatch = dirent.name.match(preDotExpr)
      if (verbMatch && validHandlerVerbs.includes(verbMatch[0].toLowerCase())) {
        return 'handler'
      }
    }
  } else if (dirent.isDirectory()) {
    if (dirent.name === '.middleware') {
      return 'middleware'
    }
    return 'dir'
  }
}

module.exports = async function walk(dir, existingRouter) {
  const routerDefinitions = await walkDir(dir, dir, { flags: {}, middleware: {} })

  routerDefinitions.sort((a, b) => {
    // compare depths - deeper routes (more specific)
    // will be mounted first
    if (a.depth > b.depth) {
      return -1
    }
    if (b.depth > a.depth) {
      return 1
    }

    // comparing route paths
    const pathComparison = a.routerPath.localeCompare(b.routerPath)
    if (pathComparison !== 0) {
      return pathComparison
    }

    // within same path - need to compare files themselves
    // standard sort will keep `all` verbs at top
    // (which we want)
    return a.filename.localeCompare(b.filename)
  })

  // creating a top-level router to encompass the others
  const router = existingRouter || express.Router()
  for (let i = 0; i < routerDefinitions.length; i++) {
    routerDefinitions[i].addRoute(router)
  }

  return router
}
