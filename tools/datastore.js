const { Datastore } = require('@google-cloud/datastore')

const options = {
    projectId: 'wildlife-247309',
}
const datastore = new Datastore(options)

async function clear() {
    const query = datastore
        .createQuery('Object')
    const [tasks] = await datastore.runQuery(query)
    tasks.forEach(async task => {
        await datastore.delete(task[datastore.KEY])
    })
}

clear()