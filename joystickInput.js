import { readdir, watch } from 'fs/promises'
import { join } from 'path'
import Joystick from '@hkaspy/joystick-linux'
import { scheduler } from 'timers/promises'
import parseEnvInt from './helpers/parseEnvInt.js'
import { config } from 'dotenv'
config()

const readGamepadDelay = parseEnvInt('READ_GAMEPAD_DELAY')

const inputsDir = '/dev/input'

const watching = new Set()

const getGamepadNumber = fileName => parseInt(fileName.slice(2))

const isGamepad = name => name.startsWith('js')

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
    .filter(isGamepad)
    .forEach(name => watchGamepad(name))

  // Watch new gamepads
  for await (const { filename } of watch(inputsDir)) {
    if (isGamepad(filename) && !watching.has(getGamepadNumber(filename))) {
      // If the delay is very small or no delay, EACCESS could be thrown
      await scheduler.wait(readGamepadDelay)
      watchGamepad(filename)
    }
  }
})()
