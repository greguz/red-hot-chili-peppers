import cmdAuth from './auth'
import cmdSensors from './sensors'

function def(cmd) {
  return Object.assign({}, cmd)
}

export default [
  // Add more commands here
  def(cmdAuth),
  def(cmdSensors)
]
