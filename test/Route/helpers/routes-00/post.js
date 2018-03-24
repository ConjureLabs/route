const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  const body = req.body
  res.send({
    value: `a_${body.thing}_b`
  })
})

module.exports = r
