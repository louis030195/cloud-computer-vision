const { Datastore } = require('@google-cloud/datastore')
const path = require('path')
const datastore = new Datastore({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

// Delete multiple entities
async function clear(entity) {
    // Tweak the entity name as you want,
    // beware it seems that GCP has quota limit on query
    // That's why the limit()
    const query = datastore
        .createQuery(entity).limit(10000)
    const [tasks] = await datastore.runQuery(query)
    tasks.forEach(async task => {
        await datastore.delete(task[datastore.KEY])
    })
}

clear('Frame')
clear('Object')
clear('Prediction')