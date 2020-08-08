const Route = require('../../../../')

Route.handlers = {
  requireApiToken: (req, res, next, args) => {
    const { token } = req.query
    const validTokens = ['1122339999-xyz', '1239-abc']

    if (!validTokens.includes(token) || args.nopeList.includes(token)) {
      return next(new Error('Invalid Token'))
    }

    next()
  }
}

const r = new Route({
  requireApiToken: {
    nopeList: ['1122339999-xyz']
  }
})

r.push(async (req, res) => {
  res.send({
    value: 'valid token'
  })
})

module.exports = r
