// const fs = require('fs').promises
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

async function main() {
  const Walk = require('./walk')

  const w = new Walk(TEST_DIR)

  const verbs = ['get', 'post', 'put', 'patch', 'delete', 'options', 'all']

  w.identify((dirent, dir) => {
    if (dirent.name === '.middleware' && dirent.isDirectory()) {
      return 'middleware'
    }

    if (!(dirent.isFile() && dirent.name.substr(-3) === '.js')) {
      return
    }

    if (dirent.name === '.middleware.js') {
      return 'middleware-config'
    }

    const verbMatch = dirent.name.match(/^(\w+)\./)
    if (verbMatch && verbs.includes(verbMatch[1])) {
      return 'route'
    }
  })

  w.orderIdentities([
    'middleware',
    'middleware-config'
  ])

  w.treatment('middleware', ({ dirent, dir, context }) => {
    const filename = dirent.name.replace(/\.js$/, '')
    context.middleware[filename] = path.resolve(dir, dirent.name)
  })

  w.treatment('middleware-config', ({ dirent, dir, context }) => {
    const filePath = path.resolve(dir, dirent.name)
    const localConfig = require(filePath)
    
    for (let key in localConfig) {
      if (typeof localConfig[key] === 'boolean') {
        context.flags[key] = localConfig[key]
      }
    }
  })

  const result = await w.start({
    middleware: [],
    flags: {}
  })
  
  console.log(result)
}
main()
