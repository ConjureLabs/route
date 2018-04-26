const Route = require('../../../../../../')

const r = new Route()

r.push(async (req, res) => {
  req.testValues.final = req.testValue()
  
  // this file is not ordered - it is expected to be last-in-line
  res.send(req.testValues)
})

module.exports = r
