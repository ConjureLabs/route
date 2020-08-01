const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res, next) => {
  res.send(`<body><h1>Hello Guest</h1></body>`)
})

module.exports = route
