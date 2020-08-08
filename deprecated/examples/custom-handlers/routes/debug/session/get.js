const Route = require('@conjurelabs/route')

const route = new Route()

route.push((req, res) => {
  const lines = []
  lines.push('------------')
  lines.push('req.session')
  lines.push('------------')
  lines.push(JSON.stringify(req.session, null, 2))
  lines.push('\n\n')

  lines.unshift('<pre>')
  lines.push('</pre>')

  res.send(
    lines.join('\n')
  )
})

module.exports = route
