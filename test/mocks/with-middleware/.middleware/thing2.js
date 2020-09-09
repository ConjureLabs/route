module.exports = (req, res, next) => {
  req.thing2 = 'thing2'
  next()
}
