const Route = require('../../../../')

const r = new Route()

r.push(async (req, res) => {
  const otherRoute = require('../routes-00/post.js').call
  const result = await otherRoute(req, {
    thing: req.query.thing
  })
  res.send({
    value: result.value
  })
})

module.exports = r
