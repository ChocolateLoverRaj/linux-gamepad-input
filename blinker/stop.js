const stop = async blinker => {
  await blinker.gpio.write(0)
}

export default stop
