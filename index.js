import { readdir } from 'fs/promises'
import { watch } from 'chokidar'

console.log(watch)

;(async () => {
  const gamepads = (await readdir('/dev/input', { withFileTypes: true }))
    .filter(input => input.isCharacterDevice())
    .map(({ name }) => name)
    .filter(name => name.startsWith('js'))
  console.log(gamepads)
})()
