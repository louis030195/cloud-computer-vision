// Import the Google Cloud client library using default credentials
// https://cloud.google.com/bigquery/docs/running-queries
const {BigQuery} = require('@google-cloud/bigquery')
const path = require('path')
const bigquery = new BigQuery({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})
async function randomDatasetBigQuery() {
  // Queries the U.S. given names dataset for the state of Texas.

  const query = `SELECT *
    FROM \`bigquery-public-data.usa_names.usa_1910_2013\`
    WHERE state = 'TX'
    LIMIT 100`

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
  }

  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  console.log('Rows:');
  rows.forEach(row => console.log(row));
}


async function queryBillingAccount() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()

  console.log('Table:');
  console.log(table[0].metadata)
  
  const query = `SELECT *
    FROM \`${table[0].metadata.id.replace(':', '.')}\`
    LIMIT 10`

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'EU',
  }

  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  console.log('Rows:');
  rows.forEach(row => console.log(row));
}

queryBillingAccount()