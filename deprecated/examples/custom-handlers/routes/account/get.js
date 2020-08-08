const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  res.send(`<body><h1>Hey there, ${req.session.name}</h1><br/><br/><p>You're logged in</p></body>`)
})

module.exports = route
