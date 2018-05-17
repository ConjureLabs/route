const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('strange')
})

module.exports = r
