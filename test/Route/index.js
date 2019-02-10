const { test } = require('ava')
const Route = require('../../')

test('Route should be an array', t => {
  const r = new Route()
  t.true(r instanceof Array)
  t.true(typeof r.length === 'number')
})

test('.copy should return a new instance, with the same routes', async t => {
  const original = require('./helpers/routes-02/get.js')
  const express = require('express')
  const request = require('supertest')

  const copy = original.copy
  t.true(original !== copy)
  t.is(copy.length, original.length)

  // modifying original route to prevent original output
  // this should not affect the copy
  original.unshift(async (req, res) => {
    res.send({
      hijacked: true
    })
  })
  t.true(copy.length < original.length)

  const app1 = express()
  const router1 = original.expressRouter('get', '/')
  app1.use(router1)
  const res1 = await request(app1).get('/')
  t.is(res1.hijacked, true)
  t.is(res1.value, undefined)

  const app2 = express()
  const router2 = copy.expressRouter('get', '/')
  app2.use(router2)
  const res2 = await request(app2).get('/')
  t.is(res2.hijacked, undefined)
  t.is(res2.value, 'yup')
})

// need to use supertest since handlers wont fire in direct clls
test('.handlers should allow custom global handlers', async t => {
  const express = require('express')
  const request = require('supertest')

  const r = require('./helpers/routes-03/get.js')
  const expressRoute = r.expressRouter('get', '/')

  const app = express()
  app.use(expressRoute)

  const res1 = await request(app).get('/?token=1122339999-xyz')
  t.is(res1.body.value, 'valid token')

  const res2 = await request(app).get('/')
  t.is(res2.status, 500)
})

// need to use supertest since handlers wont fire in direct clls
test('custom global handlers should accept arguments', async t => {
  const express = require('express')
  const request = require('supertest')

  const r = require('./helpers/routes-04/get.js')
  const expressRoute = r.expressRouter('get', '/')

  const app = express()
  app.use(expressRoute)

  const res1 = await request(app).get('/?token=1239-abc')
  t.is(res1.body.value, 'valid token')

  const res2 = await request(app).get('/')
  t.is(res2.status, 500)

  const res3 = await request(app).get('/?token=1122339999-xyz')
  t.is(res3.status, 500)
})

// need to use supertest since handlers wont fire in direct clls
test(`next('router') should skip all Route handlers`, async t => {
  const express = require('express')
  const request = require('supertest')

  const r = require('./helpers/routes-05/get.js')
  const expressRoute = r.expressRouter('get', '/')

  const app = express()
  app.use(expressRoute)

  const res1 = await request(app).get('/?skip=no')
  t.is(res1.body.value, 'hit')

  const res2 = await request(app).get('/?skip=yes')
  t.is(res2.status, 404)
})
