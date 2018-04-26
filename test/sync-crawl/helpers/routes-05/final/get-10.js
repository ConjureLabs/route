const Route = require('../../../../../')

const r = new Route()

r.push((req, res, next) => {
  next()
})

module.exports = r
