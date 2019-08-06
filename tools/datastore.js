const { Datastore } = require('@google-cloud/datastore')
const config = require('../config')
const path = require('path')
const datastore = new Datastore({
  projectId: config.get('PROJECT_ID'),
  keyFilename: path.join(__dirname, '..', config.get('GOOGLE_APPLICATION_CREDENTIALS'))
})

async function clear() {
    const query = datastore
        .createQuery('Frame')
    const [tasks] = await datastore.runQuery(query)
    tasks.forEach(async task => {
        await datastore.delete(task[datastore.KEY])
    })
}

clear()