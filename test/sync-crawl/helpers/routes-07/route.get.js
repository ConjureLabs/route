const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('route.get')
})

module.exports = r
