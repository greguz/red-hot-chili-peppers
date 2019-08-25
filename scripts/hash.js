const { hashSync } = require('bcrypt')
const saltRounds = 10
const password = process.argv[2]
const hash = hashSync(password, saltRounds)
console.log(password)
console.log(hash)
