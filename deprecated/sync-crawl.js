/*eslint no-sync: 0*/

const fs = require('fs')
const path = require('path')
const sortInsensitive = require('@conjurelabs/utils/Array/sort-insensitive')
const equalWidths = require('@conjurelabs/utils/String/equal-widths')
const debug = require('debug')('route:syncCrawl')

const defaultVerbLookup = {
  all: 'all',
  get: 'get',
  post: 'post',
  put: 'put',
  patch: 'patch',
  delete: 'delete'
}
const startingDollarSign = /^\$/
const jsFileExt = /\.js$/
const confFile = /^\.routes\.js(?:on)?$/i

class Logging {
  constructor() {
    this.stack = []
  }

  push(tokens /* == { method, routePath, filePath } */) {
    this.stack.push(tokens)
  }

  flushOut() {
    const output = this.stack.reduce((columns, tokens) => {
      columns.methods.push(tokens.method.toUpperCase())
      columns.routePaths.push(tokens.routePath)
      columns.filePaths.push(tokens.filePath)
      return columns
    }, {
      methods: [],
      routePaths: [],
      filePaths: []
    })

    output.methods = equalWidths(output.methods)
    output.routePaths = equalWidths(output.routePaths)

    for (let i = 0; i < output.methods.length; i++) {
      debug(`${output.methods[i]} ${output.routePaths[i]} --> ${output.filePaths[i]}`)
    }
  }
}

function setResolvedConf(routeInstance, confPaths) {
  const resolvedConf = confPaths.reduce((resolved, currentPath) => {
    const applied = require(currentPath)
    return { ...resolved, ...applied }
  }, {})

  routeInstance.resolvedConf = resolvedConf
}

function ensureInstance(exported) {
  const Route = require('./')

  if (exported instanceof Route) {
    return exported
  }

  const route = new Route()

  if (typeof exported === 'function') {
    route.push(exported)
  } else if (Array.isArray(exported)) {
    for (let i = 0; i < exported.length; i++) {
      if (typeof exported[i] !== 'function') {
        throw new Error('Expected an array of functions, but got a cell type of ' + (typeof exported[i]))
      }
      route.push(exported[i])
    }
  } else {
    throw new Error('Unexpected export type. Got ' + (typeof exported))
  }

  return route
}

function syncCrawlRoutesDir(rootpath, options = {}) {
  const log = new Logging()
  let firstCrawl = true

  // to avoid naming confusion later
  const verbLookup = options.verbs || defaultVerbLookup
  const { fileHandler } = options

  const verbMatches = Object.values(verbLookup).map(value => {
    if (typeof value === 'string') {
      return value.toLowerCase()
    }
    return value
  })
  const verbKeys = Object.keys(verbLookup)

  function getRoutes(dirPath, props = {}) {
    let { uriPathTokens = [], confPaths = [] } = props

    const base = path.parse(dirPath).base

    // first directory is not added to the uri path, for the express routing
    if (firstCrawl === false) {
      // adding to the tokens of the express route, based on the current directory being crawled
      // a folder starting with a $ will be considered a req param
      // (The : used in express does not work well in directory naming, and will mess up directory searching)
      uriPathTokens.push(base.replace(startingDollarSign, ':'))
    } else {
      firstCrawl = false
    }

    const list = fs.readdirSync(dirPath)
    const subDirectories = []
    const paramDirectories = []
    const routes = []
    let files = []
    let localConf

    sortInsensitive(list)

    for (const resource of list) {
      const stat = fs.statSync(path.resolve(dirPath, resource))

      if (stat.isFile()) {
        if (confFile.test(resource)) {
          confPaths = confPaths.concat(path.resolve(dirPath, resource))
          continue
        }

        if (jsFileExt.test(resource)) {
          files.push(resource)
          continue
        }
      }

      if (stat.isDirectory()) {
        if (startingDollarSign.test(resource)) {
          paramDirectories.push(resource)
          continue
        }

        subDirectories.push(resource)
      }
    }

    /*
      Example input:
      [
        'get.js',
        'GET.99.js',
        'other.js',
        'README.md'
      ]

      Example output:
      [
        { verb: 'get', order: NaN, filename: 'get.js', routeInstance: {...} },
        { verb: 'get', order: 99, filename: 'GET.99.js', routeInstance: {...} }
      ]
    */
    files = files
      .map(filename => {
        const tokens = filename.match(/^(.+?)\.?(\d*)\.js$/)

        if (!tokens) {
          return null
        }

        const routePath = path.resolve(dirPath, filename)
        const verbStr = tokens[1].toLowerCase()
        const mapping = {
          order: parseInt(tokens[2], 10),
          filename,
          filePath: path.join(dirPath, filename),
          routeInstance: require(routePath)
        }

        const indexOf = verbMatches.indexOf(verbStr)
        if (indexOf !== -1) {
          mapping.verb = verbKeys[indexOf]
        } else {
          for (let i = 0; i < verbMatches.length; i++) {
            if (!(verbMatches[i] instanceof RegExp)) {
              continue
            }
            if (verbMatches[i].test(verbStr)) {
              mapping.verb = verbKeys[i]
              break
            }
          }
        }

        if (!mapping.verb) {
          return null
        }

        if (!mapping.routeInstance.expressRouter) {
          if (fileHandler) {
            mapping.routeInstance = fileHandler(mapping.routeInstance, {
              filename,
              routePath,
              verb: mapping.verb
            })
          } else {
            mapping.routeInstance = ensureInstance(mapping.routeInstance)
          }
          // repeated check in case the above handler is not used or is not effective
          if (!mapping.routeInstance.expressRouter) {
            const relativePath = path.relative(rootpath, routePath)
            throw new Error(`Route instance is not exported from ${relativePath}`)
          }
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
        0
    })

    // hydrating confs
    for (let i = 0; i < files.length; i++) {
      setResolvedConf(files[i].routeInstance, confPaths)
      files[i].routeInstance.confPrep()
    }

    // 1. hoisting wildcard routes to top of handlers
    const wildcardIndexes = []
    for (let i = 0; i < files.length; i++) {
      if (!files[i].routeInstance.wildcardRoute) {
        continue
      }

      wildcardIndexes.push(i)
      const mapping = files[i]
      log.push({
        method: mapping.verb,
        routePath: `/${uriPathTokens.join('/')}*`,
        filePath: mapping.filePath
      })
      const newRoute = mapping.routeInstance.expressRouter(mapping.verb, '/' + uriPathTokens.join('/'))
      newRoute.filePath = mapping.filePath
      routes.push(newRoute)
    }

    // 2. removing applied wildcards
    for (let i = wildcardIndexes.length - 1; i >= 0; i--) {
      // eslint-disable-next-line no-unused-expressions
      files.splice(wildcardIndexes[i], 1)[0]
    }

    // 3. adding routes that are more specific
    for (const directory of subDirectories) {
      const subdirRoutes = getRoutes(path.resolve(dirPath, directory), { uriPathTokens: uriPathTokens.slice(), confPaths })
      for (const r of subdirRoutes) {
        routes.push(r)
      }
    }

    // 4. $param directories are considered less specific
    for (const directory of paramDirectories) {
      const subdirRoutes = getRoutes(path.resolve(dirPath, directory), { uriPathTokens: uriPathTokens.slice(), confPaths })
      for (const r of subdirRoutes) {
        routes.push(r)
      }
    }

    // 5. add current dir's handlers
    for (const mapping of files) {
      log.push({
        method: mapping.verb,
        routePath: `/${uriPathTokens.join('/')}`,
        filePath: mapping.filePath
      })
      const newRoute = mapping.routeInstance.expressRouter(mapping.verb, '/' + uriPathTokens.join('/'))
      newRoute.filePath = mapping.filePath
      routes.push(newRoute)
    }

    return routes
  }

  const routes = getRoutes(rootpath)
  log.flushOut()
  return routes
}

module.exports = syncCrawlRoutesDir