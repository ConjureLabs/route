const express = require('express')
const cookieSession = require('cookie-session')
const syncCrawl = require('@conjurelabs/route/sync-crawl')

const PORT = 3210
const server = express()

server.use(
  cookieSession({
    name: 'example',
    keys: ['asdf'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
)

// registering custom handlers
require('./route-handlers')

const routes = syncCrawl('./routes')
server.use(routes)

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`)
})
