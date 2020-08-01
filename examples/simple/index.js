const express = require('express')
const syncCrawl = require('@conjurelabs/route/sync-crawl')

const PORT = 3210
const server = express()

const routes = syncCrawl('./routes')
server.use(routes)

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
