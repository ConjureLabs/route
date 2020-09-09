module.exports = (req, res, next) => {
  req.thing1 = 'thing1'
  next()
}
