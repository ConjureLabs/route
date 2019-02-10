const Route = require('../../../../')

const r = new Route()

r.push(async (req, res) => {
  res.send({
    value: 'yup'
  })
})

module.exports = r
