module.exports = (req, res, next) => {
  req.tokens.push('t')
  next()
}
