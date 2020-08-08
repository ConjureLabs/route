const Route = require('../../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send('DELETE 2')
})

module.exports = r
