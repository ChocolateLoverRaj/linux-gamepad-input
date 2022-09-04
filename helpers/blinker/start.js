import { setInterval } from 'timers/promises'

const start = async (blinker, signal) => {
  const interval = setInterval(blinker.interval, undefined, {
    ref: false,
    signal
  })
  try {
    for await (const _ of interval) {
      await blinker.gpio.write(Number(!(await blinker.gpio.read())))
    }
  } catch (e) {
    if (e.code !== 'ABORT_ERR') throw e
  }
}

export default start
