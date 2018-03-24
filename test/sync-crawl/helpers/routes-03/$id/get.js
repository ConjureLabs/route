const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  return res.send('from ID')
})

module.exports = r
