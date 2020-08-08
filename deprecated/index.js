const cors = require('cors')
const { PermissionsError, ContentError } = require('@conjurelabs/err')
const syncCrawl = require('./sync-crawl')

const applyCustomHandler = Symbol('Wrap one-off handler with custom static handler')
const wrapWithExpressNext = Symbol('Wrap async handlers with express next()')
const routeConfPrepped = Symbol('Route conf has been prepped?')
const resolvedConf = Symbol('Resolved conf')
const inlineConf = Symbol('Inline conf')

const defaultOptions = {
  blacklistedEnv: {},
  wildcard: false,
  cors: null
}

const customHandlers = {}

class Route extends Array {
  constructor(options = {}) {
    super()

    this[inlineConf] = options
    this[resolvedConf] = {}
    this[routeConfPrepped] = false
  }

  static set handlers(handlers = {}) {
    for (const key in handlers) {
      defaultOptions[key] = false
      customHandlers[key] = handlers[key]
    }
  }

  static set defaultOptions(options = {}) {
    for (const key in options) {
      defaultOptions[key] = options[key]
    }
  }

  set resolvedConf(conf) {
    this[resolvedConf] = conf
  }

  // handler must be already express wrapped
  [applyCustomHandler](customHandler, handler, applyArgs) {
    customHandler = this[wrapWithExpressNext].bind(this)(customHandler)

    return (req, res, next) => {
      customHandler(req, res, err => {
        if (err) {
          return next(err)
        }

        handler(req, res, next)
      }, applyArgs)
    }
  }

  // wraps async handlers with next()
  [wrapWithExpressNext](handler) {
    if (handler instanceof Promise) {
      throw new ContentError('Express handlers need to be (req, res, next) or aysnc (req, res, next)')
    }

    if (handler.constructor.name !== 'AsyncFunction') {
      return handler
    }

    return (req, res, nextOriginal) => {
      // preventing double call on next()
      let nextCalled = false
      const next = (...args) => {
        if (nextCalled === true) {
          return
        }
        nextCalled = true

        nextOriginal(...args)
      }

      // express can't take in a promise (async func), so have to proxy it
      const handlerProxy = async callback => {
        try {
          await handler(req, res, callback)
        } catch(err) {
          callback(err)
        }
      }

      handlerProxy(err => next(err))
    }
  }

  confPrep() {
    if (this[routeConfPrepped]) {
      return
    }
    this[routeConfPrepped] = true

    const optionsUsed = {
      ...defaultOptions,
      ...this[resolvedConf],
      ...this[inlineConf]
    }

    this.wildcardRoute = optionsUsed.wildcard
    this.cors = optionsUsed.cors

    for (const handlerKey in customHandlers) {
      this[handlerKey] = optionsUsed[handlerKey]
    }

    this.suppressedRoutes = false
    for (const key in optionsUsed.blacklistedEnv) {
      const envVar = process.env[key]
      const blacklistedArray = optionsUsed.blacklistedEnv[key]

      if (envVar && blacklistedArray.includes(envVar)) {
        this.suppressedRoutes = true
        break
      }
    }
  }

  expressRouterPrep() {
    // placeholder
  }

  expressRouter(verb, expressPath) {
    this.confPrep()
    this.expressRouterPrep()

    const express = require('express')
    const router = express.Router()

    if (this.suppressedRoutes === true) {
      return router
    }

    const expressPathUsed = this.wildcardRoute ? expressPath.replace(/\/$/, '') + '*' : expressPath
    const expressVerb = verb.toLowerCase()

    for (let handler of this) {
      handler = this[wrapWithExpressNext].bind(this)(handler)

      for (const handlerKey in customHandlers) {
        if (this[handlerKey]) {
          handler = this[applyCustomHandler].bind(this)(customHandlers[handlerKey], handler, typeof this[handlerKey] === 'boolean' ? undefined : this[handlerKey])
        }
      }

      if (this.cors) {
        // see https://github.com/expressjs/cors#enabling-cors-pre-flight
        router.options(expressPathUsed, cors(this.cors))
        router[expressVerb](expressPathUsed, cors(this.cors), handler)
      } else {
        router[expressVerb](expressPathUsed, handler)
      }
    }

    return router
  }

  get copy() {
    const copy = new Route()
    copy.wildcardRoute = this.wildcard
    copy.cors = this.cors
    copy.suppressedRoutes = this.suppressedRoutes
    copy.push(...this.slice())
    return copy
  }
}

module.exports = Route
module.exports.syncCrawl = syncCrawl
