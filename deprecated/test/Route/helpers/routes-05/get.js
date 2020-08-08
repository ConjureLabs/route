const Route = require('../../../../')

Route.handlers = {
  shouldSkip: (req, res, next) => {
    const { skip } = req.query

    if (skip === 'yes') {
      return next('router') // see https://expressjs.com/en/guide/using-middleware.html#middleware.router
    }
    next()
  }
}

const r = new Route({
  shouldSkip: true
})

r.push(async (req, res) => {
  res.send({
    value: 'hit'
  })
})

r.push(async (req, res) => {
  res.send({
    value: 'should not hit'
  })
})

module.exports = r
