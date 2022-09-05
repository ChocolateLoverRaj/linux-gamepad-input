import { Gpio } from 'onoff'
import start from './helpers/blinker/start.js'
import { config } from 'dotenv'
import { createBluetooth } from 'node-ble'
import watchIfExists from './helpers/watchIfExists.js'
import changeIterator from './helpers/changeIterator.js'
import { setInterval, scheduler } from 'timers/promises'
import isGamepad from './helpers/isGamepad.js'
import Joystick from '@hkaspy/joystick-linux'
import parseEnvInt from './helpers/parseEnvInt.js'
config()

const bluetooth = createBluetooth()

const buttonGpio = parseEnvInt('BUTTON_GPIO')
const bluetoothLightGpio = parseEnvInt('BLUETOOTH_LIGHT_GPIO')
const outputLightGpio = parseEnvInt('OUTPUT_LIGHT_GPIO')
const readGamepadDelay = parseEnvInt('READ_GAMEPAD_DELAY')

const button = new Gpio(buttonGpio, 'in', 'rising')
const bluetoothLight = new Gpio(bluetoothLightGpio, 'out')
const outputLight = new Gpio(outputLightGpio, 'out')

const blinker = {
  gpio: bluetoothLight,
  interval: 150,
  startOn: true
}

let blinkController
;(async () => {
  const adapterPromise = bluetooth.bluetooth.defaultAdapter()

  let gamepadExists

  button.watch(async err => {
    if (err) {
      throw err
    }

    if (gamepadExists) {
      // TODO: Connect to different device
    } else {
      if (blinkController) {
        blinkController.abort()
      }
      blinkController = new AbortController()
      start(blinker, blinkController.signal)

      const adapter = await adapterPromise
      await adapter.startDiscovery()
      /* eslint-disable-next-line no-labels */
      Discovery: for await (const _ of setInterval(1000, undefined)) {
        const devices = await adapter.devices()
        for (const id of devices) {
          const device = await adapter.getDevice(id)
          const getName = async () => {
            try {
              return await device.getName()
            } catch {}
          }
          const name = await getName()
          if (name !== undefined && isGamepad(name)) {
            console.log('Connecting to gamepad: ' + name)
            try {
              await device.pair()
              await device.connect()
              console.log('Connected to gamepad: ' + name)
              /* eslint-disable-next-line no-labels */
              break Discovery
            } catch {
              console.log('Failed to gamepad: ' + name)
            }
          }
        }
      }
      await adapter.stopDiscovery()
    }
  })

  const joystickPath = '/dev/input/js0'
  const existsIterator = changeIterator(watchIfExists(joystickPath, {
    initialCheck: true,
    watchOptions: { persistent: false }
  }))
  for await (gamepadExists of existsIterator) {
    await bluetoothLight.write(Number(gamepadExists))
    if (blinkController) {
      blinkController.abort()
      blinkController = undefined
    }

    if (gamepadExists) {
      // If the delay is very small or no delay, EACCESS could be thrown
      await scheduler.wait(readGamepadDelay)
      // FIXME: new Joystick causes delay in exiting after Ctrl+C
      new Joystick(joystickPath, { includeInit: true })
        .on('update', ({ number, type, value }) => {
          if (type === 'BUTTON' && number === 0) {
            outputLight.write(value)
          }
        })
        .on('error', e => {
          if (e.code !== 'ENODEV') throw e
        })
    }
  }
})()

process.on('SIGINT', async () => {
  blinkController?.abort()
  await bluetoothLight.write(0)
  bluetooth.destroy()
  button.unexport()
  bluetoothLight.unexport()
  process.exit(0)
})
