const fs = require('fs').promises
const path = require('path')
// const sortInsensitive = require('@conjurelabs/utils/Array/sort-insensitive')
// const equalWidths = require('@conjurelabs/utils/String/equal-widths')
// const debug = require('debug')('route:syncCrawl')

const TEST_DIR = '/Users/mars/tmarshall/tonic/app/api/routes'

// async function walkDir(dir) {
//   const files = await fs.readdir(dir, { withFileTypes: true })
//   console.log(files)

//   const found = {
//     middleware: undefined,
//     middlewareConfig: undefined,
//     subDirs: [],
//     routes: []
//   }

//   const pendingAssignments = []
//   const pendingPromises = []

//   for (let i = 0; i < files.length; i++) {
//     if (files[i].isDirectory()) {
//       if (files[i].name === '.middleware') {
//         pendingAssignments.push('middleware')
//         pendingPromises.push(walkMiddleware(path.resolve(dir, files[i].name)))
//       }
//     }
//   }

//   const results = await Promise.all(pendingPromises)

//   for (let i = 0; i < pendingAssignments.length; i++) {
//     found[pendingAssignments[i]] = results[i]
//   }

//   console.log(found)
// }

// async function walkMiddleware(dir) {
//   const files = await fs.readdir(dir, { withFileTypes: true })

//   const middleware = {}
//   for (let i = 0; i < files.length; i++) {
//     if (!files[i].isFile() || !files[i].name.substr(-3) === '.js') {
//       continue
//     }

//     const filenameWithoutExt = files[i].name.substr(0, files[i].name.length - 3)

//     middleware[filenameWithoutExt] = path.resolve(dir, files[i].name)
//   }

//   return middleware
// }

// walkDir(TEST_DIR)

// x = function() {
//   return new Promise(resolve => resolve(12))
// }
// let result
// async function main() {
//   let pending = []
//   pending.push(result)

//   const promises = [x()]

//   pending = Promise.all([result])
// }
// main()

const jsExtensionExpr = /\.js$/

// async function main() {
//   const Walk = require('./walk')

//   const w = new Walk(TEST_DIR)

//   const verbs = ['get', 'post', 'put', 'patch', 'delete', 'options', 'all']

//   w.identify((dirent, dir) => {
//     if (dirent.name === '.middleware' && dirent.isDirectory()) {
//       return 'middleware'
//     }

//     if (!(dirent.isFile() && dirent.name.substr(-3) === '.js')) {
//       return
//     }

//     if (dirent.name === '.middleware.js') {
//       return 'middleware-config'
//     }

//     const verbMatch = dirent.name.match(/^(\w+)\./)
//     if (verbMatch && verbs.includes(verbMatch[1])) {
//       return 'route'
//     }
//   })

//   w.orderIdentities([
//     'middleware',
//     'middleware-config'
//   ])

//   w.treatment('middleware', async ({ dirent, dir, context }) => {
//     const middlewareDir = path.resolve(dir, dirent.name)
//     const dirents = await fs.readdir(middlewareDir, { withFileTypes: true })

//     for (let i = 0; i < dirents.length; i++) {
//       if (!dirents[i].isFile() && !jsExtensionExpr.test(dirents[i].name)) {
//         continue
//       }

//       context.middlewarePaths[ dirents[i].name.replace(jsExtensionExpr, '') ] = async (req, res, next, skipAll) => {
//         const middlewareFunc = require( path.resolve(middlewareDir, dirent[i].name) )
//       }
//     }
//     const filename = dirent.name.replace(jsExtensionExpr, '')
//     context.middleware[filename] = path.resolve(dir, dirent.name)
//   })

//   w.treatment('middleware-config', ({ dirent, dir, context }) => {
//     const filePath = path.resolve(dir, dirent.name)
//     const localConfig = require(filePath)
    
//     for (let key in localConfig) {
//       if (typeof localConfig[key] === 'boolean') {
//         context.flags[key] = localConfig[key]
//       }
//     }
//   })

//   w.treatment('route', attributes => {
//     const { dirent, dir } = attributes
//     attributes.handler = require(path.resolve(dir, dirent.name))
//   })

//   const result = await w.start({
//     middlewarePaths: [],
//     flags: {},
//     middleware: {}
//   })

//   console.log(result)

//   // grouping results by dir + filtering out non-relevant results
//   const routeGroupings = result.reduce((groupings, attributes) => {
//     const { identity, dir } = attributes

//     if (identity !== 'route' && identity !== 'middleware-config') {
//       return groupings
//     }

//     if (!groupings[dir]) {
//       groupings[dir] = []
//     }
//     groupings[dir].push(attributes)

//     return groupings
//   }, {})

//   // getting sorted keys, which would move :id params above specific paths
//   const routeGroupingKeys = Object.keys(routeGroupings)

//   console.log(routeGroupings)



//   return Object.keys(routeGroupings).map(dir => {
//     const grouping = routeGroupings[dir]
//   })
// }
// main()

// attributes -> { flags: { [key]: bool }, middleware: { [key]: function }, methods: [], path: [] }
// all objects are flat
// `methods` is an array of arrays, where indexes signify route depth
// `path` is a an array of path strings (starting at root) that also signify depth
async function walkDir(dir, attributes) {
  const dirDirents = await fs.readdir(dir, { withFileTypes: true })
  let flags, fusedFlags
  let middleware, fusedMiddleware

  for (let i = 0; i < dirents.length; i++) {
    const dirent = dirDirents[i]
    const type = direntType(dirent)
    let subdirs = []
    const handlers = []

    switch (type) {
      case 'dir':
        subdirs.push(dirent.name)
        break

      case 'handler':
        handlers.push(dirent.name)
        break

      case 'flags':
        flags = require(path.resolve(dir, dirent.name))
        break

      case 'middleware':
        middleware = walkMiddleware(path.resolve(dir, dirent.name))
        break
    }
  }

  if (!handlers.length && !subDirs.length) {
    return []
  }
  attributes.methods[]

  if (flags) {
    fusedFlags = { ...attributes.flags, ...flags }
  }

  if (middleware) {
    fusedMiddleware = { ...attributes.middleware, ...middleware }
  }

  const methods = []

  for (let i = 0; i < handlers.length; i++) {
    methods.push(...routeMethods(handlers[i], fusedMiddleware, fusedFlags))
  }

  methods.push(...(await Promise.all(subdirs)))



  if (subdirs) {
    subdirs = subdirs.map(subdir => walkDir(
      path.resolve(dir, subdir),
      {
        flags: fusedFlags || flags,
        middleware: fusedMiddleware || middleware,
        methods: attributes.methods
      }
    ))
  }

  

  return methods
}

async function routeMethods(handler, middleware, flags) {
  const fusedFlags = handler.middlewareFlags ? { ...flags, ...handler.middlewareFlags } : flags
  const methods = []

  const prep = (req, res, next) => {
    req.__routeContext = { skip: false }
    next()
  }

  methods.push(prep)

  for (let key in fusedFlags) {
    if (!fusedFlags[key]) {
      continue
    }

    methods.push(wrappedRouteHandler(middleware[key], true))
  }

  methods.push(wrappedRouteHandler(handler, false))

  return methods
}

function wrappedRouteHandler(handler, withSkip) {
  const isAsync = handler.constructor.name === 'AsyncFunction'

  return async (req, res, next) => {
    if (req.__routeContext.skip) {
      return next()
    }

    const skipMethod = withSkip ? req => { req.__routeContext.skip = true } : undefined

    if (skipMethod) {
      if (isAsync) {
        await handler(req, res, next, skipMethod)
      } else {
        handler(req, res, next, skipMethod)
      }
    } else {
      if (isAsync) {
        await handler(req, res, next)
      } else {
        handler(req, res, next)
      }
    }
  }
}

async function walkMiddleware(dir) {
  const dirDirents = await fs.readdir(dir, { withFileTypes: true })
  const middleware = {}

  for (let i = dirDirents.length; i++) {
    const dirent = dirDirents[i]

    if (dirent.isFile() && jsExtensionExpr.test(dirent.name)) {
      middleware[dirent.name] = require(path.resolve(dir, dirent.name))
    }
  }

  return middleware
}

// can return undefined
function direntType(dirent) {
  if (dirent.isFile()) {
    if (dirent.name === '.middleware.flags.js') {
      return 'flags'
    }
    if (jsExtensionExpr.test(dirent.name)) {
      return 'handler'
    }
  } else if (dirent.isDirectory()) {
    if (dirent.name === '.middleware') {
      return 'middleware'
    }
    return 'dir'
  }
}

module.exports = async function walk(dir) {

}
module.expors(TEST_DIR)
