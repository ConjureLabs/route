const Route = require('../../../../../')

const r = new Route({
  wildcard: true
})

r.push((req, res) => {
  res.send('TOP')
})

module.exports = r
