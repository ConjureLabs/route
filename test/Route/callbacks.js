const { test } = require('ava')
const Route = require('../../')

test('Route should return expected results', t => {
  const r = new Route()
  r.push((req, res, next) => {
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
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res, next) => {
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

test('should not trigger additional handlers', t => {
  const r = new Route()
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res, next) => {
    res.send('success')
  })
  r.push((req, res, next) => {
    res.send('nope')
  })
  const express = require('express')
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
