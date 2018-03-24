const { test } = require('ava')
const path = require('path')
const express = require('express')
const syncCrawl = require('../../sync-crawl')

const Router = express.Router

const crawl = dirname => syncCrawl(path.resolve(__dirname, 'helpers', dirname))

test('should return an array', t => {
  const routes = crawl('routes-00')
  t.true(Array.isArray(routes))
  t.is(routes.length, 1)
})

test('should return expected results when handled', t => {
  const router = new Router()
  router.use(crawl('routes-00'))
  router.handle({
    url: '/',
    method: 'GET'
  }, {
    send: val => {
      t.is(val, 'Howdy')
    }
  })
})
