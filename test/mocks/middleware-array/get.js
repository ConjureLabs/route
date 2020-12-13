module.exports = (req, res) => {
  const hasBothThings = req.thing1 && req.thing2 ? true : false
  res.send(hasBothThings ? 'okay' : 'missing')
}
