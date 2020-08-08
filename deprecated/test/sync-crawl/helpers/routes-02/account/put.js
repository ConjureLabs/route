const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send('PUT 2')
})

module.exports = r
