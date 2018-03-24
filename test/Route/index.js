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
  const getDirect = require('./helpers/routes-00/post.js').call
  const result = await getDirect({ url: '/', method: 'GET' }, { thing: 'xyz' })
  t.is(result.value, 'a_xyz_b')
})
