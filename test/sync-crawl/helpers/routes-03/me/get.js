const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  return res.send('from ME')
})

module.exports = r
