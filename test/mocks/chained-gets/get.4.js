module.exports = (req, res) => {
  req.tokens.push('e')
  res.send(req.tokens.join(''))
}
