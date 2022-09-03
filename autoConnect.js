import { Gpio } from 'onoff'
import start from './blinker/start.js'
import stop from './blinker/stop.js'
import { config } from 'dotenv'
config()
import {createBluetooth} from 'node-ble'
import { access}  from 'fs/promises'
import { once } from 'events'
import watchIfExists from './watchIfExists.js'
import changeIterator from './changeIterator.js'
import { setInterval } from 'timers/promises'
import mapAsync1By1 from './mapAsync1By1.js'
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

;(async () => {
  const adapterPromise = bluetooth.bluetooth.defaultAdapter()

  let gamepadExists
  let blinkController
  
  button.watch(async err => {
    if (err) {
      throw err
    }

    if (gamepadExists) {
      // TODO: Connect to different device
    } else {
      const adapter = await adapterPromise
      // const devices = await adapter.devices()
      // for (const id of devices) {
      //   const device = await adapter.getDevice(id)
      //   console.log(`Name: ${await device.getName()}`)
      //   console.log(`Address Type: ${await device.getAddressType()}`)
      //   console.log(`Address: ${await device.getAddress()}`)
      //   console.log(`Paired: ${await device.isPaired()}`)
      //   console.log(`Connected: ${await device.isConnected()}`)
      //   device.on('connect', async () => {
      //     console.log('Connect')
      //     console.log('Bluetooth device connected: ', await device.getName())
      //   })
      //   device.on('disconnect', async () => {
      //     console.log('Bluetooth device disconnected: ', await device.getName())
      //   })
      // }
      await adapter.startDiscovery()
      for await (const _ of setInterval(1000, undefined)) {
        console.log((await mapAsync1By1(await adapter.devices(), async id => {
          try {
            const device = await adapter.getDevice(id)   
            // return [{
            //   name: await device.getName(),
            //   address: await device.getAddress(),
            //   paired: await device.isPaired(),
            //   connected: await device.isConnected()
            // }]
          } catch (e) {
            return []
          }
        })).flat())
      }

      if (blinkController) {
        blinkController.abort()
      }
      blinkController = new AbortController()
      start(blinker, blinkController.signal)
    }
  })

  for await (gamepadExists of changeIterator(watchIfExists('/dev/input/js0', true))) {
    await bluetoothLight.write(Number(gamepadExists))
    if (blinkController) {
      blinkController.abort()
      blinkController = undefined
    }
  }
})()

process.on('SIGINT', async () => {
  await stop(blinker)
  bluetooth.destroy()
  button.unexport()
  bluetoothLight.unexport()
})
