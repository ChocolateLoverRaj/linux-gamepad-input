import { createReadStream } from 'fs'
import { readdir } from 'fs/promises'
import { join } from 'path'
import Joystick from '@hkaspy/joystick-linux'

const inputsDir = '/dev/input'

;(async () => {
  const gamepads = (await readdir(inputsDir, { withFileTypes: true }))
    .filter(input => input.isCharacterDevice())
    .map(({ name }) => name)
    .filter(name => name.startsWith('js'))
  console.log(gamepads)
  gamepads.forEach(gamepad => {
    const stick = new Joystick(join(inputsDir, gamepad))
    stick.on('update', console.log)
  })
})()
