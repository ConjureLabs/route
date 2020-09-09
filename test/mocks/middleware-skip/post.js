module.exports = (req, res, next) => {
  res.send('hit')
}

module.exports.middlewareFlags = {
  doSkip: true
}
