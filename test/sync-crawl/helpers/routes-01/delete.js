const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('DELETE 1')
})

module.exports = r
