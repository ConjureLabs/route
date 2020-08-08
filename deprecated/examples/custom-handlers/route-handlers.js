const Route = require('@conjurelabs/route')

Route.handlers = {
  requireLoggedIn: (req, res, next) => {
    if (!req.session || !req.session.id) {
      return next(new Error('Invalid auth'))
    }
    next()
  }
}
