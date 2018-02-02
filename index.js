const cors = require('cors');
const { PermissionsError, ContentError } = require('err');

const requireAuthenticationWrapper = Symbol('Require Auth Wrapper');
const wrapWithExpressNext = Symbol('Wrap async handlers with express next()');

// methods of res that should not prevent next() call
const resTerminalMethods = [
  'send', 'sendFile', 'sendStatus',
  'format', 'json', 'jsonp',
  'redirect', 'render', 'end'
];

const defaultOptions = {
  blacklistedEnv: {},
  requireAuthentication: false,
  wildcard: false,
  skippedHandler: null,
  cors: null
};

class Route extends Array {
  constructor(options = {}) {
    super();

    const optionsUsed = Object.assign({}, defaultOptions, options);

    this.requireAuthentication = optionsUsed.requireAuthentication;
    this.wildcardRoute = optionsUsed.wildcard;
    this.skippedHandler = optionsUsed.skippedHandler;
    this.cors = optionsUsed.cors;

    this.call = this.call.bind(this);

    this.suppressedRoutes = false;
    for (let key in optionsUsed.blacklistedEnv) {
      const envVar = process.env[key];
      const blacklistedArray = optionsUsed.blacklistedEnv[key];

      if (envVar && blacklistedArray.includes(envVar)) {
        this.suppressedRoutes = true;
        break;
      }
    }
  }

  static set defaultOptions(options = {}) {
    for (let key in options) {
      defaultOptions[key] = options[key];
    }
  }

  [requireAuthenticationWrapper](handler) {
    const skippedHandler = this.skippedHandler;

    return (req, res, next) => {
      if (!req.isAuthenticated()) {
        if (typeof skippedHandler === 'function') {
          return this[wrapWithExpressNext](skippedHandler)(req, res, next);
        }
        return next();
      }

      if (!req.user) {
        return next(new PermissionsError('No req.user available'));
      }

      return this[wrapWithExpressNext](handler)(req, res, next);
    };
  }

  // wraps async handlers with next()
  [wrapWithExpressNext](handler) {
    if (handler instanceof Promise) {
      throw new ContentError('Express handlers need to be (req, res, next) or aysnc (req, res, next)');
    }

    if (handler.constructor.name !== 'AsyncFunction') {
      return handler;
    }

    return (req, res, next) => {
      // express can't take in a promise (async func), so have to proxy it
      const handlerProxy = async callback => {
        let sent = false;

        for (let i = 0; i < resTerminalMethods.length; i++) {
          const key = resTerminalMethods[i];
          const original = res[key];
          res[key] = function(...args) {
            sent = true;
            res[key] = original; // set back
            original.call(this, ...args);
          };
        }

        try {
          await handler(req, res, next);
        } catch(err) {
          return callback(err);
        }

        callback(null, sent);
      };

      handlerProxy((err, sent) => {
        if (err) {
          return next(err);
        }

        // if res.send was called, kill the express flow
        if (sent === true) {
          return;
        }

        next();
      });
    };
  }

  expressRouterPrep() {
    // placeholder
  }

  expressRouter(verb, expressPath) {
    this.expressRouterPrep();

    const express = require('express');
    const router = express.Router();

    if (this.suppressedRoutes === true) {
      return router;
    }

    const expressPathUsed = this.wildcardRoute ? expressPath.replace(/\/$/, '') + '*' : expressPath;
    const expressVerb = verb.toLowerCase();

    for (let i = 0; i < this.length; i++) {
      const methodUsed = this.requireAuthentication ? this[requireAuthenticationWrapper].bind(this) : this[wrapWithExpressNext].bind(this);

      if (this.cors) {
        // see https://github.com/expressjs/cors#enabling-cors-pre-flight
        router.options(expressPathUsed, cors(this.cors));
        router[expressVerb](expressPathUsed, cors(this.cors), methodUsed(this[i]));
      } else {
        router[expressVerb](expressPathUsed, methodUsed(this[i]));
      }
    }

    return router;
  }

  async call(req, args = {}, params = {}) {
    req = Object.assign({}, req, {
      body: args,
      query: args
    }, {
      params
    });

    const tasks = [].concat(this);

    for (let i = 0; i < tasks.length; i++) {
      const resProxy = {
        send: data => new DirectCallResponse(data)
      };

      let taskResult;

      if (tasks[i].constructor.name === 'AsyncFunction') {
        taskResult = await tasks[i](req, resProxy);
      } else {
        taskResult = await promisifiedHandler(tasks[i], req);
      }

      if (taskResult) {
        if (taskResult instanceof DirectCallResponse) {
          return taskResult.data;
        }
        return;
      }
    }
  }
}

class DirectCallResponse {
  constructor(data) {
    this.data = data;
  }
}

function promisifiedHandler(handler, req) {
  return new Promise((resolve, reject) => {
    handler(req, {
      send: data => {
        return resolve(new DirectCallResponse(data));
      }
    }, err => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

module.exports = Route;
