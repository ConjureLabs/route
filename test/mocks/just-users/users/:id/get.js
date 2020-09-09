module.exports = async (req, res) => {
  const record = new Promise(resolve => {
    resolve(req.params.id)
  })
  const result = await record
  res.send(result)
}
