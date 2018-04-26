const Route = require('../../../../../../')

const r = new Route()

r.push(async (req, res, next) => {
  // inital - needs to also set obj
  req.testValues = {
    zero: null,
    one: null,
    nine: null,
    ten: null,
    final: null
  }

  let currentValue = 1
  req.testValue = () => {
    currentValue += Math.floor(Math.random() * 10) + 1
    return currentValue
  }

  req.testValues.zero = req.testValue()
  next()
})

module.exports = r
