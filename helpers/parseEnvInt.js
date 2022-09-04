const parseEnvInt = envVar => {
  const envVarString = process.env[envVar]
  const int = parseInt(envVarString)
  if (!Number.isInteger(int)) {
    throw new Error(`The env var ${envVar} is ${envVarString}, which is not a valid integer.`)
  }
  return int
}

export default parseEnvInt
