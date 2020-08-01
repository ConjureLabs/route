const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  res.send('Foo')
})

module.exports = route
