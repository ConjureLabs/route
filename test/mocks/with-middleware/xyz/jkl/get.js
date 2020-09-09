module.exports = (req, res) => {
  res.send(req.thing1 || req.thing2 || 'fallback')
}

module.exports.middlewareFlags = {
  thing1: false,
  thing2: true
}
