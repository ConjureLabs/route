const Route = require('../../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('FINAL')
})

module.exports = r
