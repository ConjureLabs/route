module.exports = (req, res, next) => {
  req.tokens = ['r']
  next()
}
