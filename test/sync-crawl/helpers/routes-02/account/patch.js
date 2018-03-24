const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send('PATCH 2')
})

module.exports = r
