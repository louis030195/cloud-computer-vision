const { Datastore } = require('@google-cloud/datastore')
const config = require('../config')
const path = require('path')
const datastore = new Datastore({
  projectId: config.get('PROJECT_ID'),
  keyFilename: path.join(__dirname, '..', config.get('GOOGLE_APPLICATION_CREDENTIALS'))
})

// Delete multiple entities
async function clear() {
    // Tweak the entity name as you want,
    // beware it seems that GCP has quota limit on query
    // That's why the limit()
    const query = datastore
        .createQuery('Object').limit(1000)
    const [tasks] = await datastore.runQuery(query)
    tasks.forEach(async task => {
        await datastore.delete(task[datastore.KEY])
    })
}

clear()