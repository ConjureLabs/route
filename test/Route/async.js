const { test } = require('ava')
const Route = require('../../')

test('Route should return expected results', async t => {
  const r = new Route()
  r.push(async (req, res) => {
    res.send('awesome')
  })
  const expressRoute = r.expressRouter('get', '/foo/bar')
  expressRoute.handle({
    url: '/foo/bar',
    method: 'GET'
  }, {
    send: val => {
      t.is(val, 'awesome')
    }
  })
})

test('next() should work', t => {
  const r = new Route()
  r.push(async (req, res, next) => {
    next()
  })
  r.push(async (req, res, next) => {
    next()
  })
  r.push(async (req, res) => {
    res.send('yup')
  })
  const expressRoute = r.expressRouter('get', '/foo/bar')
  expressRoute.handle({
    url: '/foo/bar',
    method: 'GET'
  }, {
    send: val => {
      t.is(val, 'yup')
    }
  })
})

test('should work when mixed with callbacks', t => {
  const r = new Route()
  r.push(async (req, res, next) => {
    next()
  })
  r.push((req, res, next) => {
    next()
  })
  r.push(async (req, res) => {
    res.send('yup')
  })
  const expressRoute = r.expressRouter('get', '/foo/bar')
  expressRoute.handle({
    url: '/foo/bar',
    method: 'GET'
  }, {
    send: val => {
      t.is(val, 'yup')
    }
  })
})

test('should not trigger additional handlers', t => {
  const r = new Route()
  r.push(async (req, res, next) => {
    next()
  })
  r.push(async (req, res) => {
    res.send('success')
  })
  r.push(async (req, res) => {
    res.send('nope')
  })
  const expressRoute = r.expressRouter('get', '/foo/bar')
  expressRoute.handle({
    url: '/foo/bar',
    method: 'GET'
  }, {
    send: val => {
      t.is(val, 'success')
    }
  })
})

test('thrown errors should trigger next(err)', async t => {
  const express = require('express')
  const request = require('supertest')

  const r = new Route()
  r.push(async (req, res, next) => {
    next() // no error
  })
  r.push(async () => {
    throw new Error('A test error occurred')
  })
  r.push(async (req, res) => {
    res.send('yup')
  })
  const expressRoute = r.expressRouter('get', '/foo/bar')

  const app = express()
  app.use(expressRoute)

  const res = await request(app).get('/foo/bar')

  t.is(res.status, 500)
})
