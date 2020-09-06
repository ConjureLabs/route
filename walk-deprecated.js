const fs = require('fs').promises
const path = require('path')

const directorySym = Symbol('directory')

class Walk {
  constructor(dir) {
    this.baseDir = dir
    this.indentifiers = []
    this.order = []
    this.treatments = {}

    return this
  }

  identify(fn) {
    this.indentifiers.push(fn)
    return this
  }

  orderIdentities(order) {
    this.order = deepClone(order)
    return this
  }

  treatment(id, fn) {
    this.treatments[id] = fn
    return this
  }

  async start(baseContext = {}) {
    const indentifiers = this.indentifiers.concat((dirent, dir) => {
      if (dirent.isDirectory()) {
        return directorySym
      }
    })

    // traverses a directory, returning an array of objects, representing files + specific directories
    // { dirent, dir, context, identity }
    async function walkDir(dir, parentContext) {
      const dirents = await fs.readdir(dir, { withFileTypes: true })
      const collection = [] // [{ dirent, identity }]
      let localContext = deepClone(parentContext)

      // determine ids
      for (let i = 0; i < dirents.length; i++) {
        const collectionItem = {
          dirent: dirents[i],
          dir,
          context: localContext
        }
        collection.push(collectionItem)

        for (let j = 0; j < indentifiers.length; j++) {
          const identity = indentifiers[j](dirents[i], dir)
          if (identity && (
            (typeof identity === 'string') ||
            (typeof identity === 'symbol')
          )) {
            collectionItem.identity = identity
            break
          }
        }
      }

      // sort collection of dirents, by identity
      // but keep directorySym dirents at the bottom,
      // so they can be walked after context are filled in and locked
      collection.sort((itemA, itemB) => {
        if (itemA.identity === directorySym) {
          return 1
        }
        if (itemB.identity === directorySym) {
          return -1
        }

        const indexA = this.order.indexOf(itemA.identity)
        const indexB = this.order.indexOf(itemB.identity)

        if (indexA > -1 && indexB === -1) {
          return -1
        }
        if (indexA === -1 && indexB > -1) {
          return 1
        }

        return indexA < indexB ? -1 :
          indexA > indexB ? 1 :
          itemA.dirent.name.toLowerCase().localeCompare(itemB.dirent.name.toLowerCase())
      })

      // building out a list of pending sub-directories
      // this will leave `collection` clear of directories
      const pendingSubDirPaths = []
      do {
        if (!collection.length || collection[ collection.length - 1 ].identity !== directorySym) {
          break
        }

        const collectionItem = collection.pop()
        const subDir = path.resolve(dir, collectionItem.dirent.name)
        pendingSubDirPaths.unshift(subDir)
      } while (true)

      // processing non-dir, sorted, dirents
      for (let i = 0; i < collection.length; i++) {
        const collectionItem = collection[i]
        const identity = collectionItem.identity

        if (typeof identity === 'string' && this.treatments[identity]) {
          if (this.treatments[identity].constructor.name === 'AsyncFunction') {
            await this.treatments[identity](collectionItem)
          } else {
            this.treatments[identity](collectionItem)
          }
        }
      }

      // initiate walking of subdirs
      const pendingSubDirs = []
      for (let i = 0; i < pendingSubDirPaths.length; i++) {
        pendingSubDirs.push(walkDir.call(this, pendingSubDirPaths[i], localContext))
      }

      // wrap up walking of subdirs & build out results
      const subDirs = await Promise.all(pendingSubDirs)
      const result = [...collection]
      for (let i = 0; i < subDirs.length; i++) {
        result.push(...subDirs[i])
      }

      return result
    }

    const walked = await walkDir.call(this, this.baseDir, baseContext)
    return walked
  }
}

function deepClone(base) {
  return JSON.parse(JSON.stringify(base))
}

module.exports = Walk
