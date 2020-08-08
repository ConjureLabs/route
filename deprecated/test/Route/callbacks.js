const test = require('ava')
const Route = require('../../')

test('Route should return expected results', t => {
  const r = new Route()
  r.push((req, res) => {
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
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res) => {
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
  r.push((req, res, next) => {
    next()
  })
  r.push((req, res) => {
    res.send('success')
  })
  r.push((req, res) => {
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
