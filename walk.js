const fs = require('fs').promises
const path = require('path')

const directorySym = Symbol('directory')

class Walk {
  constructor(dir) {
    this.baseDir = dir
    this.indentifiers = []
    this.identitiesSort = () => 0
    this.treatments = {}

    return this
  }

  identify(fn) {
    this.indentifiers.push(fn)
    return this
  }

  sortIdentities(fn) {
    this.identitiesSort = fn
    return this
  }

  treatment(id, fn) {
    this.treatments[id] = fn
    return this
  }

  async start(context = {}) {
    const indentifiers = this.indentifiers.concat((dirent, dir) => {
      if (dirent.isDirectory()) {
        return directorySym
      }
    })

    // traverses a directory, returning an array of objects, representing files + specific directories
    // { dirent, dir, context, identity }
    async function walkDir(dir, context = {}) {
      const dirents = await fs.readdir(dir, { withFileTypes: true })
      const collection = [] // [{ dirent, identity }]
      const localContext = deepClone(context)

      // determine ids
      getDirentIdentities:
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
            continue getDirentIdentities
          }
        }
      }

      // sort collection of dirents, by identity
      // but keep directorySym dirents at top,
      // so they can be walked
      collection.sort((itemA, itemB) => {
        if (itemA.identity === directorySym) {
          return -1
        }
        if (itemB.identity === directorySym) {
          return 1
        }
        return this.identitiesSort(itemA.identity, itemB.identity)
      })

      const pendingSubDirs = []

      do {
        if (!collection.length || collection[0].identity !== directorySym) {
          break
        }

        const collectionItem = collection.shift()
        const subDir = path.resolve(dir, collectionItem.dirent.name)
        pendingSubDirs.push(walkDir.call(this, subDir, localContext))
      } while (true)

      const subDirs = await Promise.all(pendingSubDirs)
      const result = [...collection]
      for (let i = 0; i < subDirs.length; i++) {
        result.push(...subDirs[i])
      }

      return result
    }
    const result = await walkDir.call(this, this.baseDir, context)
    return result
  }
}

function deepClone(base) {
  return JSON.parse(JSON.stringify(base))
}

module.exports = Walk
