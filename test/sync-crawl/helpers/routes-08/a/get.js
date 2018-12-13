const Route = require('../../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('number is 1')
})

module.exports = r
