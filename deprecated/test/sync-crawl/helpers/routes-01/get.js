const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('GET 1')
})

module.exports = r
