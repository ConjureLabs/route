const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('traditional patch')
})

module.exports = r
