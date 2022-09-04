import { Gpio } from 'onoff'
import start from './blinker/start.js'
import { config } from 'dotenv'
import { createBluetooth } from 'node-ble'
import { access } from 'fs/promises'
import { once } from 'events'
import watchIfExists from './watchIfExists.js'
import changeIterator from './changeIterator.js'
import { setInterval } from 'timers/promises'
import mapAsync1By1 from './mapAsync1By1.js'
import isGamepad from './isGamepad.js'
config()

const bluetooth = createBluetooth()

const parseGpio = envVar => {
  const envVarString = process.env[envVar]
  const gpio = parseInt(envVarString)
  if (!Number.isInteger(gpio)) {
    throw new Error(`The env var ${envVar} is ${envVarString}, which is not a valid integer.`)
  }
  return gpio
}

const buttonGpio = parseGpio('BUTTON_GPIO')
const bluetoothLightGpio = parseGpio('BLUETOOTH_LIGHT_GPIO')
const outputLightGpio = parseGpio('OUTPUT_LIGHT_GPIO')

const button = new Gpio(buttonGpio, 'in', 'rising')
const bluetoothLight = new Gpio(bluetoothLightGpio, 'out')

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
              await device.connect()
              console.log('Connected to gamepad: ' + name)
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

  for await (gamepadExists of changeIterator(watchIfExists('/dev/input/js0', { initialCheck: true, watchOptions: { persistent: false } }))) {
    await bluetoothLight.write(Number(gamepadExists))
    if (blinkController) {
      blinkController.abort()
      blinkController = undefined
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
