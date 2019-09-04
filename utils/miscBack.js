async function bash(command) {
  return new Promise(async (resolve, reject) => {
    const util = require('util')
    const exec = util.promisify(require('child_process').exec)
    await exec(command)
    .then(res => resolve(res.stdout))
    .catch(err => reject(err))
  })
}

module.exports = {
  bash
}