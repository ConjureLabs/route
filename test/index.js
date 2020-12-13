const test = require('ava')
const path = require('path')
const express = require('express')
const got = require('got')
const http = require('http')
const listen = require('test-listen')

const walkRoutes = require('../')

const Router = express.Router

test('should mount expected route handlers', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'just-users'))
  const app = express()
  app.use(routes)
  const url = await listen(http.createServer(app))
  let res

  res = await got.post(`${url}/users`)
  t.is(res.body, 'post')

  res = await got.get(`${url}/users/7150`)
  t.is(res.body, '7150')

  res = await got.patch(`${url}/users/7150`)
  t.is(res.body, 'patch')

  res = await got.delete(`${url}/users/7150`)
  t.is(res.body, 'delete')
})

test('should chain multiple handlers of the same verb', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'chained-gets'))
  const app = express()
  app.use(routes)
  const url = await listen(http.createServer(app))
  let res

  res = await got.get(url)
  t.is(res.body, 'route')
})

test('should implement expected middleware', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'with-middleware'))
  const app = express()
  app.use(routes)
  const url = await listen(http.createServer(app))
  let res

  res = await got.get(url)
  t.is(res.body, 'fallback')

  res = await got.get(`${url}/abc`)
  t.is(res.body, 'thing2')

  res = await got.get(`${url}/abc/jkl`)
  t.is(res.body, 'thing1')

  res = await got.get(`${url}/xyz`)
  t.is(res.body, 'thing1')

  res = await got.get(`${url}/xyz/jkl`)
  t.is(res.body, 'thing2')

  res = await got.get(`${url}/other`)
  t.is(res.body, 'fallback')
})

test('should allow skipping routes via middleware', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'middleware-skip'))
  const app = express()
  app.use(routes)
  const url = await listen(http.createServer(app))
  let res

  res = await got.get(url)
  t.is(res.body, 'hit')

  let thrown
  try {
    res = await got.post(url)
  } catch(err) {
    thrown = err.message
  }
  t.is(thrown, 'Response code 404 (Not Found)')
})

test('a single route file should be able to export an array of handlers', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'exported-array'))
  const app = express()
  app.use(routes)
  const url = await listen(http.createServer(app))
  let res

  res = await got.get(url)
  t.is(res.body, 'good')
})
