import { watch } from 'fs/promises'

(async () => {
  const watcher = watch('/dev/input')
  for await (const event of watcher) {
    console.log(event)
  }
})()
