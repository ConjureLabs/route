const Route = require('../../../../../../')

const r = new Route()

r.push(async (req, res) => {
  return res.send('From FOO')
})

module.exports = r
