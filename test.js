import watchIfExists from './watchIfExists.js'
import changeIterator from './changeIterator.js'

(async () => {
  const watcher = changeIterator(watchIfExists('/dev/input/js0'))
  for await (const event of watcher) {
    console.log(event)
  }
})()
