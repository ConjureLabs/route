const cors = require('cors')
const { PermissionsError, ContentError } = require('@conjurelabs/err')

const applyCustomHandler = Symbol('Wrap one-off handler with custom static handler')
const requireAuthenticationWrapper = Symbol('Require Auth Wrapper')
const wrapWithExpressNext = Symbol('Wrap async handlers with express next()')

const defaultOptions = {
  blacklistedEnv: {},
  requireAuthentication: false,
  wildcard: false,
  skippedHandler: null,
  cors: null
}

const customHandlers = {}

class Route extends Array {
  constructor(options = {}) {
    super()

    const optionsUsed = {
      ...defaultOptions,
      ...options
    }

    this.requireAuthentication = optionsUsed.requireAuthentication
    this.wildcardRoute = optionsUsed.wildcard
    this.skippedHandler = optionsUsed.skippedHandler
    this.cors = optionsUsed.cors

    for (const handlerKey in customHandlers) {
      this[handlerKey] = optionsUsed[handlerKey]
    }

    this.call = this.call.bind(this)

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

  [applyCustomHandler](customHandler, handler /* must be already express wrapped */) {
    customHandler = this[wrapWithExpressNext].bind(this)(customHandler)

    return (req, res, next) => {
      customHandler(req, res, err => {
        if (err) {
          return next(err)
        }

        handler(req, res, next)
      })
    }
  }

  [requireAuthenticationWrapper](handler) {
    const skippedHandler = this.skippedHandler

    return (req, res, next) => {
      if (!req.isAuthenticated()) {
        if (typeof skippedHandler === 'function') {
          return this[wrapWithExpressNext](skippedHandler)(req, res, next)
        }
        return next()
      }

      if (!req.user) {
        return next(new PermissionsError('No req.user available'))
      }

      this[wrapWithExpressNext](handler)(req, res, next)
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

  expressRouterPrep() {
    // placeholder
  }

  expressRouter(verb, expressPath) {
    this.expressRouterPrep()

    const express = require('express')
    const router = express.Router()

    if (this.suppressedRoutes === true) {
      return router
    }

    const expressPathUsed = this.wildcardRoute ? expressPath.replace(/\/$/, '') + '*' : expressPath
    const expressVerb = verb.toLowerCase()

    for (let handler of this) {
      handler = this.requireAuthentication ? this[requireAuthenticationWrapper].bind(this)(handler) : this[wrapWithExpressNext].bind(this)(handler)

      for (const handlerKey in customHandlers) {
        if (this[handlerKey]) {
          handler = this[applyCustomHandler].bind(this)(customHandlers[handlerKey], handler)
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
    copy.requireAuthentication = this.requireAuthentication
    copy.wildcardRoute = this.wildcard
    copy.skippedHandler = this.skippedHandler
    copy.cors = this.cors
    copy.suppressedRoutes = this.suppressedRoutes
    copy.push(...this.slice())
    return copy
  }

  async call(req, args = {}, params = {}) {
    req = {
      ...req,
      body: args,
      query: args,
      params
    }

    const tasks = [].concat(this)

    for (const task of tasks) {
      let taskResult
      const resProxy = {
        send: data => {
          taskResult = new DirectCallResponse(data)
        }
      }

      if (task.constructor.name === 'AsyncFunction') {
        await task(req, resProxy)
      } else {
        await promisifiedHandler(task, req, resProxy)
      }

      if (taskResult) {
        if (taskResult instanceof DirectCallResponse) {
          return taskResult.data
        }
        return
      }
    }
  }
}

class DirectCallResponse {
  constructor(data) {
    this.data = data
  }
}

function promisifiedHandler(handler, req, res) {
  return new Promise((resolve, reject) => {
    const originalSend = res.send
    res.send = (...args) => {
      resolve(...args)
      originalSend(...args)
    }
    handler(req, res, err => {
      if (err) {
        reject(err)
      }
    })
  })
}

module.exports = Route
