import { Gpio } from 'onoff'
import start from './blinker/start.js'
import stop from './blinker/stop.js'
import { config } from 'dotenv'
config()
import {createBluetooth} from 'node-ble'

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
  startOn: true,
  abortController: new AbortController()
}

;(async () => {
  const adapterPromise = bluetooth.bluetooth.defaultAdapter()
  button.watch(async err => {
    if (err) {
      throw err
    }
  
    const adapter = await adapterPromise
    const devices = await adapter.devices()
    for (const id of devices) {
      const device = await adapter.getDevice(id)
      console.log(`Name: ${await device.getName()}`)
      console.log(`Address Type: ${await device.getAddressType()}`)
      console.log(`Address: ${await device.getAddress()}`)
      console.log(`Paired: ${await device.isPaired()}`)
      console.log(`Connected: ${await device.isConnected()}`)
    }
    start(blinker)
  })
})()

process.on('SIGINT', async () => {
  await stop(blinker)
  bluetooth.destroy()
  button.unexport()
  bluetoothLight.unexport()
})
