'use strict'

const { Datastore } = require('@google-cloud/datastore')
const path = require('path')
const ds = new Datastore({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

const kind = 'Class'

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

function list (cb) {
  const q = ds
    .createQuery([kind])
    
  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err)
      return
    }
    cb(null, entities.map(fromDatastore))
  })
}


function listBy (dataset, cb) {
  const q = ds
    .createQuery([kind])
    .filter('dataset', '=', dataset)

  ds.runQuery(q, (err, entities, nextQuery) => {
    if (err) {
      cb(err)
      return
    }
    cb(null, entities.map(fromDatastore))
  })
}

module.exports = {
  list: list,
  listBy: listBy
}
