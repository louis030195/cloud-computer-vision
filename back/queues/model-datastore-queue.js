'use strict'

const { Datastore } = require('@google-cloud/datastore')
const path = require('path')
const ds = new Datastore({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})
const kind = 'Queue'

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore (obj) {
  obj.id = obj[Datastore.KEY].id
  return obj
}

// Lists all queues in the Datastore sorted alphabetically by title.
// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, queues, nextPageToken)``.
function list (token, cb) {
  const q = ds
    .createQuery([kind])
    .start(token)

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err)
      return
    }
    const hasMore =
      nextQuery.moreResults !== Datastore.NO_MORE_RESULTS
        ? nextQuery.endCursor
        : false
    cb(null, entities.map(fromDatastore), hasMore)
  })
}

module.exports = {
  list: list
}
