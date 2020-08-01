const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  res.send('<body><h1>Hello world</h1></body>')
})

module.exports = route
