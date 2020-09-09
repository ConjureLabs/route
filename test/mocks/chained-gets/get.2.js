module.exports = (req, res, next) => {
  req.tokens.push('u')
  next()
}
