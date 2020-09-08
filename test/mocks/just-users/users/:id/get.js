module.exports = async (req, res) => {
  const record = new Promise(resolve => {
    resolve(req.params.id)
  })
}
