const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  res.send('Bar')
})

module.exports = route
