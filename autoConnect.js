import { Gpio } from 'onoff'
import start from './blinker/start.js'
import stop from './blinker/stop.js'
import { config } from 'dotenv'
config()

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

button.watch(err => {
  if (err) {
    throw err
  }

  start(blinker)
})

process.on('SIGINT', async () => {
  await stop(blinker)
  button.unexport()
  bluetoothLight.unexport()
})
