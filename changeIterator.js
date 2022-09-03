async function * changeIterator (iterator) {
  let started = false
  let previousValue
  for await (const value of iterator) {
    if (!started) {
      started = true
      previousValue = value
      yield value
    } else if (value !== previousValue) {
      previousValue = value
      yield value
    }
  }
}

export default changeIterator
