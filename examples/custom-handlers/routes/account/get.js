const Route = require('@conjurelabs/route')

const route = new Route({
  requireLoggedIn: true
})

route.push((req, res) => {
  res.send(`<body><h1>Hello, ${req.session.name}</h1></body>`)
})

module.exports = route
