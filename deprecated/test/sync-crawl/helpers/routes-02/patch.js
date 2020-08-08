const Route = require('../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send('PATCH 1')
})

module.exports = r
