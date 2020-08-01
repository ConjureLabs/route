const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res, next) => {
  if (!req.session || !req.session.id) {
    return next()
  }

  res.send(`<body><h1>Hello ${req.session.name}</h1></body>`)
})

module.exports = route
