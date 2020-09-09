module.exports = (req, res, next) => {
  req.tokens.push('o')
  next()
}
