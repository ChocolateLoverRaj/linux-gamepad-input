import { setInterval } from 'timers/promises'

const start = async blinker => {
  const interval = setInterval(blinker.interval, undefined, { 
    ref: false, 
    signal: blinker.abortController.signal 
  })
  for await (const _ of interval) {
    await blinker.gpio.write(Number(!(await blinker.gpio.read())))
  }
}

export default start
