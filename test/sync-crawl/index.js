const test = require('ava')
const path = require('path')
const express = require('express')
const syncCrawl = require('../../sync-crawl')
const Route = require('../../')

const Router = express.Router

const crawl = (...args) => {
  // args[0] is dirname
  args[0] = path.resolve(__dirname, 'helpers', args[0])
  return syncCrawl(...args)
}

test('should return an array', t => {
  const routes = crawl('routes-00')
  t.true(Array.isArray(routes))
  t.is(routes.length, 1)
})

test('should return expected results when handled', t => {
  const router = new Router()
  router.use(crawl('routes-00'))
  router.handle({ url: '/', method: 'GET' }, {
    send: val => {
      t.is(val, 'Howdy')
    }
  })
})

test('should return expected results when there are several handlers and dirs', t => {
  const router = new Router()
  router.use(crawl('routes-01'))

  router.handle({ url: '/', method: 'GET' }, {
    send: val => {
      t.is(val, 'GET 1')
    }
  })
  router.handle({ url: '/', method: 'POST' }, {
    send: val => {
      t.is(val, 'POST 1')
    }
  })
  router.handle({ url: '/', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'PATCH 1')
    }
  })
  router.handle({ url: '/', method: 'PUT' }, {
    send: val => {
      t.is(val, 'PUT 1')
    }
  })
  router.handle({ url: '/', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'DELETE 1')
    }
  })

  router.handle({ url: '/account', method: 'GET' }, {
    send: val => {
      t.is(val, 'GET 2')
    }
  })
  router.handle({ url: '/account', method: 'POST' }, {
    send: val => {
      t.is(val, 'POST 2')
    }
  })
  router.handle({ url: '/account', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'PATCH 2')
    }
  })
  router.handle({ url: '/account', method: 'PUT' }, {
    send: val => {
      t.is(val, 'PUT 2')
    }
  })
  router.handle({ url: '/account', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'DELETE 2')
    }
  })

  router.handle({ url: '/everyone', method: 'GET' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'POST' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'PUT' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
})

test('should return expected results when there are several handlers and dirs (II)', t => {
  const router = new Router()
  router.use(crawl('routes-02'))

  router.handle({ url: '/', method: 'GET' }, {
    send: val => {
      t.is(val, 'GET 1')
    }
  })
  router.handle({ url: '/', method: 'POST' }, {
    send: val => {
      t.is(val, 'POST 1')
    }
  })
  router.handle({ url: '/', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'PATCH 1')
    }
  })
  router.handle({ url: '/', method: 'PUT' }, {
    send: val => {
      t.is(val, 'PUT 1')
    }
  })
  router.handle({ url: '/', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'DELETE 1')
    }
  })

  router.handle({ url: '/account', method: 'GET' }, {
    send: val => {
      t.is(val, 'GET 2')
    }
  })
  router.handle({ url: '/account', method: 'POST' }, {
    send: val => {
      t.is(val, 'POST 2')
    }
  })
  router.handle({ url: '/account', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'PATCH 2')
    }
  })
  router.handle({ url: '/account', method: 'PUT' }, {
    send: val => {
      t.is(val, 'PUT 2')
    }
  })
  router.handle({ url: '/account', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'DELETE 2')
    }
  })

  router.handle({ url: '/everyone', method: 'GET' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'POST' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'PUT' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
  router.handle({ url: '/everyone', method: 'DELETE' }, {
    send: val => {
      t.is(val, 'ALL 1')
    }
  })
})

test('should go throuh sepcific routes before param routes', t => {
  const router = new Router()
  router.use(crawl('routes-03'))
  
  router.handle({ url: '/me', method: 'GET' }, {
    send: val => {
      t.is(val, 'from ME')
    }
  })
  router.handle({ url: '/abc', method: 'GET' }, {
    send: val => {
      t.is(val, 'from ID')
    }
  })
})

test('should work when there are nested param routes', t => {
  const router = new Router()
  router.use(crawl('routes-04'))
  
  router.handle({ url: '/foo/123', method: 'GET' }, {
    send: val => {
      t.is(val, 'From FOO')
    }
  })
  router.handle({ url: '/foo/123/bar/987', method: 'GET' }, {
    send: val => {
      t.is(val, 'From BAR')
    }
  })
})

test('should honor multiple of one verb, ordered', t => {
  const router = new Router()
  router.use(crawl('routes-05'))
  
  router.handle({ url: '/final', method: 'GET' }, {
    send: val => {
      t.is(val, 'FINAL')
    }
  })
  router.handle({ url: '/zero', method: 'GET' }, {
    send: val => {
      t.is(val, 'ZERO')
    }
  })
  router.handle({ url: '/one', method: 'GET' }, {
    send: val => {
      t.is(val, 'ONE')
    }
  })
  router.handle({ url: '/nine', method: 'GET' }, {
    send: val => {
      t.is(val, 'NINE')
    }
  })
  router.handle({ url: '/ten', method: 'GET' }, {
    send: val => {
      t.is(val, 'TEN')
    }
  })
})

test('should honor multiple of one verb, ordered (II)', t => {
  const router = new Router()
  router.use(crawl('routes-06'))
  
  router.handle({ url: '/without-wildcard/more-specific', method: 'GET' }, {
    send: val => {
      t.is(val, 'SPECIFIC')
    }
  })
  router.handle({ url: '/without-wildcard', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })

  router.handle({ url: '/with-wildcard/more-specific', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })
  router.handle({ url: '/with-wildcard', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })
})

test('should honor verb matching strings when specified', t => {
  const router = new Router()
  router.use(crawl('routes-07', {
    verbs: {
      get: 'route.get',
      patch: 'patch'
    }
  }))
  
  router.handle({ url: '/', method: 'GET' }, {
    send: val => {
      t.is(val, 'route.get')
    }
  })
  router.handle({ url: '/', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'traditional patch')
    }
  })
})

test('should honor regexp matching strings when specified', t => {
  const router = new Router()
  router.use(crawl('routes-07', {
    verbs: {
      get: /filename$/i,
      patch: /^patch$/i
    }
  }))
  
  router.handle({ url: '/', method: 'GET' }, {
    send: val => {
      t.is(val, 'strange')
    }
  })
  router.handle({ url: '/', method: 'PATCH' }, {
    send: val => {
      t.is(val, 'traditional patch')
    }
  })
})

test('should allow custom file handling as a fallback', t => {
  const router = new Router()
  router.use(crawl('routes-08', {
    fileHandler: content => {
      const route = new Route()
      route.push((req, res) => {
        res.send(`number is ${content.num}`)
      })
      return route
    }
  }))

  router.handle({ url: '/a', method: 'GET' }, {
    send: val => {
      t.is(val, 'number is 1')
    }
  })
  router.handle({ url: '/b', method: 'GET' }, {
    send: val => {
      t.is(val, 'number is 2')
    }
  })
  router.handle({ url: '/c', method: 'GET' }, {
    send: val => {
      t.is(val, 'number is 3')
    }
  })
})

test('should pass expected context when calling custom file handling', t => {
  let cachedContext // set at file handling

  const router = new Router()
  router.use(crawl('routes-09', {
    verbs: {
      get: /.+/ // any name...
    },

    fileHandler: (content, context) => {
      cachedContext = context

      const route = new Route()
      route.push((req, res) => {
        res.send(`name is ${content.name}`)
      })
      return route
    }
  }))

  // checking context
  t.is(cachedContext.filename, 'fancy-name.js')
  t.true(/routes-09\/xyz\/fancy-name\.js$/.test(cachedContext.routePath))
  t.is(cachedContext.verb, 'get')
})

test('should be able to require syncCrawl directly from module', t => {
  const syncCrawl2 = require('../../').syncCrawl
  t.is(syncCrawl2, syncCrawl)
})

test('should honor multiple of one verb, ordered (III)', t => {
  const router = new Router()
  router.use(crawl('routes-10'))
  
  router.handle({ url: '/without-wildcard/more-specific', method: 'GET' }, {
    send: val => {
      t.is(val, 'SPECIFIC')
    }
  })
  router.handle({ url: '/without-wildcard', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })

  router.handle({ url: '/with-wildcard/more-specific', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })
  router.handle({ url: '/with-wildcard', method: 'GET' }, {
    send: val => {
      t.is(val, 'TOP')
    }
  })
})
