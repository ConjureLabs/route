const routes = []

routes.push((req, res, next) => {
  next()
})

routes.push((req, res) => {
  res.send('hit')
})

module.exports = routes
