const Route = require('../../../../../')

const r = new Route()

r.push((req, res) => {
  res.send('number is 3')
})

r.num = 45

module.exports = r
