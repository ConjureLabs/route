const Route = require('../../../../')

Route.handlers = {
  requireApiToken: (req, res, next) => {
    const { token } = req.query
    const validToken = '1122339999-xyz'

    if (token !== validToken) {
      return res.send({
        value: 'INVALID TOKEN!'
      })
    }

    next()
  }
}

const r = new Route({
  requireApiToken: true
})

r.push(async (req, res) => {
  res.send({
    value: 'valid token'
  })
})

module.exports = r
