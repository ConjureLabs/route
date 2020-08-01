const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  req.session = undefined
  res.send({ success: true })
})

module.exports = route
