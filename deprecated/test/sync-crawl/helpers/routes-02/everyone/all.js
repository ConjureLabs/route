const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send('ALL 1')
})

module.exports = r
