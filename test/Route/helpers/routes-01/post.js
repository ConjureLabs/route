const Route = require('../../../../')

const r = new Route()

r.push(async (req, res) => {
  const otherRoute = require('./get.js').call
  const result = await otherRoute(req, {
    thing: req.body.thing
  })
  res.send({
    value: result.value
  })
})

module.exports = r
