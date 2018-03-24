const Route = require('../../../../')

const r = new Route()

r.push((req, res) => {
  res.send({
    value: 'something'
  })
})

module.exports = r
