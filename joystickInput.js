import { createReadStream } from 'fs'
import { readdir, watch } from 'fs/promises'
import { join } from 'path'
import Joystick from '@hkaspy/joystick-linux'
import { scheduler } from 'timers/promises'

const inputsDir = '/dev/input'

const watching = new Set()

const getGamepadNumber = fileName => parseInt(fileName.slice(2))

;(async () => {
  const watchGamepad = (gamepad) => {
    const gamepadNumber = getGamepadNumber(gamepad)
    console.log(gamepadNumber, 'connect')
    watching.add(gamepadNumber)
    const stick = new Joystick(join(inputsDir, gamepad))
    stick
      .on('update', ({ time, number, type, value }) => {
        console.log(gamepadNumber, time, type, number, value)
      })
      .on('error', e => {
        if (e.code !== 'ENODEV') throw e
        watching.delete(gamepadNumber)
        console.log(gamepadNumber, 'disconnect')
      })
  }

  // Watch already connected gamepads
  const dirs = await readdir(inputsDir)
  dirs
    .filter(name => name.startsWith('js'))
    .forEach(name => watchGamepad(name))

  // Watch new gamepads
  for await (const { filename } of watch(inputsDir)) {
    if (filename.startsWith('js') && !watching.has(getGamepadNumber(filename))) {
      await scheduler.wait(1000)
      watchGamepad(filename)
    }
  }
  const gamepads = (await readdir(inputsDir, { withFileTypes: true }))
    .filter(input => input.isCharacterDevice())
    .map(({ name }) => name)
    .filter(name => name.startsWith('js'))
  console.log(gamepads)
  gamepads.forEach(async gamepad => {
    const stick = new Joystick(join(inputsDir, gamepad))
    stick.on('update', console.log)
  })
})()
