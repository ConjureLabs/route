const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  req.session.id = 123
  req.session.name = 'J. Doe'
  res.send({ success: true })
})

module.exports = route
