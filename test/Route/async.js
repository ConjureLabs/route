const { test } = require('ava')
const Route = require('../../')

test('Route should return expected results', async t => {
  const r = new Route()
  r.push(async (req, res, next) => {
    res.send('awesome')
  })
  const express = require('express')
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
  r.push(async (req, res, next) => {
    res.send('yup')
  })
  const express = require('express')
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
  r.push(async (req, res, next) => {
    res.send('yup')
  })
  const express = require('express')
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

