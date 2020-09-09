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
