module.exports = ((req, res) => {
  const { id } = req.params

  res.send(`User id is ${id}`)
})
