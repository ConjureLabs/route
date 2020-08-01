const Route = require('@conjurelabs/route')

const route = new Route({
  requireLoggedIn: false
})

route.push((req, res) => {
  req.session = undefined
  res.send({ success: true })
})

module.exports = route
