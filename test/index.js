const test = require('ava')
const path = require('path')
const express = require('express')
const request = require('supertest')

const walkRoutes = require('../')

const Router = express.Router

test('should mount expected route handlers', async t => {
  const routes = await walkRoutes(path.resolve(__dirname, 'mocks', 'just-users'))
  const app = express()
  app.use(routes)

  console.log(routes)

  let res

  res = await request(app).post('/users/')
  console.log(res.status)
  t.is(res.body.value, 'post')
})
