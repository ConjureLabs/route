const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  const { id } = req.params

  res.send(`User id is ${id}`)
})

module.exports = route
