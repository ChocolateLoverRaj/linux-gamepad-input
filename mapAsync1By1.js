const mapAsync1By1 = async (promisesArr, mapFn) => {
  const arr = []
  for (const promise of promisesArr) {
    arr.push(await mapFn(promise))
  }
  return arr
}

export default mapAsync1By1
