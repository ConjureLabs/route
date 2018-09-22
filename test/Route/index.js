const { test } = require('ava')
const Route = require('../../')

test('Route should be an array', t => {
  const r = new Route()
  t.true(r instanceof Array)
  t.true(typeof r.length === 'number')
})

test('.call should return value on GET request', async t => {
  const getDirect = require('./helpers/routes-00/get.js').call
  const result = await getDirect({ url: '/', method: 'GET' })
  t.is(result.value, 'something')
})

test('.call should return value on POST request', async t => {
  const postDirect = require('./helpers/routes-00/post.js').call
  const result = await postDirect({ url: '/', method: 'POST' }, { thing: 'xyz' })
  t.is(result.value, 'a_xyz_b')
})

test('.call should work within a .call', async t => {
  const direct = require('./helpers/routes-01/get.js').call
  const result = await direct({ url: '/', method: 'GET' }, { thing: 'thang' })
  t.is(result.value, 'a_thang_b')

  const direct2 = require('./helpers/routes-01/post.js').call
  const result2 = await direct2({ url: '/', method: 'POST' }, { thing: 'foo' })
  t.is(result2.value, 'a_foo_b')
})

test('.copy should return a new instance, with the same routes', async t => {
  const original = require('./helpers/routes-02/get.js')
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
  const originalDirect = original.call
  const originalResult = await originalDirect({ url: '/', method: 'GET' }, { thing: 'bar' })
  t.is(originalResult.hijacked, true)

  const copyDirect = copy.call
  const copyResult = await copyDirect({ url: '/', method: 'GET' }, { thing: 'bar' })
  t.is(copyResult.value, 'a_bar_b')
})
