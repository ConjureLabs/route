/*eslint no-sync: 0*/

const fs = require('fs')
const path = require('path')
const sortInsensitive = require('@conjurelabs/utils/Array/sort-insensitive')

const validVerbs = ['all', 'get', 'post', 'put', 'patch', 'delete']
const startingDollarSign = /^\$/
const jsFileExt = /\.js$/
const validFilename = /-\d+?$/

function syncCrawlRoutesDir(rootpath) {
  let firstCrawl = true

  function getRoutes(dirpath, uriPathTokens = []) {
    const base = path.parse(dirpath).base

    // first directory is not added to the uri path, for the express routing
    if (firstCrawl === false) {
      // adding to the tokens of the express route, based on the current directory being crawled
      // a folder starting with a $ will be considered a req param
      // (The : used in express does not work well in directory naming, and will mess up directory searching)
      uriPathTokens.push(base.replace(startingDollarSign, ':'))
    } else {
      firstCrawl = false
    }

    const list = fs.readdirSync(dirpath)
    const delayedDirectories = []
    const routes = []
    let files = []

    sortInsensitive(list)

    for (let i = 0; i < list.length; i++) {
      const stat = fs.statSync(path.resolve(dirpath, list[i]))

      if (stat.isFile() && jsFileExt.test(list[i])) {
        files.push(list[i])
        continue
      }

      if (stat.isDirectory()) {
        if (startingDollarSign.test(list[i])) {
          delayedDirectories.push(list[i])
          continue
        }

        const subdirRoutes = getRoutes(path.resolve(dirpath, list[i]), uriPathTokens.slice())

        for (let j = 0; j < subdirRoutes.length; j++) {
          routes.push(subdirRoutes[j])
        }
      }
    }

    for (let i = 0; i < delayedDirectories.length; i++) {
      const subdirRoutes = getRoutes(path.resolve(dirpath, delayedDirectories[i]), uriPathTokens.slice())

      for (let j = 0; j < subdirRoutes.length; j++) {
        routes.push(subdirRoutes[j])
      }
    }

    /*
      Example input:
      [
        'get.js',
        'GET-99.js',
        'other.js',
        'README.md'
      ]

      Example output:
      [
        { verb: 'get', order: NaN, filename: 'get.js' },
        { verb: 'get', order: 99, filename: 'GET-99.js' }
      ]
    */
    files = files
      .map(filename => {
        const tokens = filename.match(/^([a-zA-Z]+)-?(\d*)\.js/)

        if (!tokens) {
          return null
        }

        const mapping = {
          verb: tokens[1].toLowerCase(),
          order: parseInt(tokens[2], 10),
          filename
        }

        if (!validVerbs.includes(mapping.verb)) {
          return null
        }

        return mapping
      })
      .filter(mapping => !!mapping)

    // files may be like ['get.js', 'get-1.js', 'get-11.js', 'get12.js']
    // we want to order so that explicit numbers are in order,
    // and 'get.js' would come last
    files.sort((a, b) => {
      const aNaN = Number.isNaN(a.order)
      const bNaN = Number.isNaN(b.order)

      return aNaN && bNaN ? 0 :
        aNaN ? 1 :
        bNaN ? -1 :
        a.order < b.order ? -1 :
        a.order > b.order ? 1 :
        0
    })

    // lifting back up all.js to front
    files.sort((a, b) => {
      return a.verb < b.verb ? -1 :
        a.verb > b.verb ? 1 :
        0;
    })

    for (let mapping of files) {
      const routePath = path.resolve(dirpath, mapping.filename)
      const individualRoute = require(routePath)

      if (!individualRoute.expressRouter) {
        const relativePath = path.relative(rootpath, routePath)
        throw new Error(`Route instance is not exported from ${relativePath}`)
      }

      routes.push(individualRoute.expressRouter(mapping.verb, '/' + uriPathTokens.join('/')))
    }

    return routes
  }

  return getRoutes(rootpath)
}

module.exports = syncCrawlRoutesDir
