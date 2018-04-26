const Route = require('../../../../../../')

const r = new Route()

r.push(async (req, res, next) => {
  req.testValues.nine = req.testValue()
  next()
})

module.exports = r
