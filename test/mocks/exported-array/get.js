const handlers = []

handlers.push(
  (req, res, next) => {
    req.tokens = ['g']
    next()
  }
)

handlers.push(
  (req, res, next) => {
    req.tokens.push('o')
    next()
  }
)

handlers.push(
  (req, res, next) => {
    req.tokens.push('o')
    next()
  }
)

handlers.push(
  (req, res, next) => {
    req.tokens.push('d')
    next()
  }
)

handlers.push(
  (req, res) => {
    res.send(req.tokens.join(''))
  }
)

module.exports = handlers
