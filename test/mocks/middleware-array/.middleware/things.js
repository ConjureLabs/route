const fn1 =(req, res, next) => {
  req.thing1 = 'thing1'
  next()
}

const fn2 = (req, res, next) => {
  req.thing2 = 'thing2'
  next()
}

module.exports = [fn1, fn2]

