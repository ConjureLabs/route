const Route = require('../../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('PUT 2')
})

module.exports = r
