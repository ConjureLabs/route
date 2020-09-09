module.exports = (req, res) => {
  res.send(req.thing1 || req.thing2 || 'fallback')
}
