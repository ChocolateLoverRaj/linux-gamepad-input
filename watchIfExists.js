import { watch } from 'fs/promises'
import { basename, dirname } from 'path'
import { existsSync } from 'fs'

async function * watchIfExists (path, initialCheck = false) {
  if (initialCheck) yield existsSync(path)
  const watcher = watch(dirname(path))
  for await (const { filename } of watcher) {
    if (filename === basename(path)) {
      yield existsSync(path)
    }
  }
}

export default watchIfExists
