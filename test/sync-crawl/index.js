const { test } = require('ava')
const path = require('path')
const express = require('express')
const syncCrawl = require('../../sync-crawl')

const Router = express.Router

const crawl = dirname => {
  return syncCrawl(path.resolve(__dirname, 'helpers', dirname))
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

test('should return expected results when there are several handlers and dirs', t => {
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
