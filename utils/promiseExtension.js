// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
function timeoutPromise(promise, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeout)
    promise.then(resolve, reject)
  })
}

module.exports = {
  timeoutPromise
}