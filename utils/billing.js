// Import the Google Cloud client library using default credentials
// https://cloud.google.com/bigquery/docs/running-queries
const {BigQuery} = require('@google-cloud/bigquery')
const path = require('path')
const bigquery = new BigQuery({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

async function sqlQuery(query) {
    // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
    const options = {
      query: query,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'EU',
    }
  
    // Run the query as a job
    const [job] = await bigquery.createQueryJob(options)

    // Wait for the query to finish
    const [rows] = await job.getQueryResults()
  
    return rows
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
  rows.forEach(row => console.log(row.service.description));
}

async function billingAppEngine() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `SELECT *
    FROM \`${table[0].metadata.id.replace(':', '.')}\`
    WHERE service.description LIKE '%App%'
    LIMIT 10`

  rows = await sqlQuery(query)
  rows.forEach(row => console.log(row))
}

async function totalInvoice() {


  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `  
  SELECT invoice.month,
  SUM(cost)
    + SUM(IFNULL((SELECT SUM(c.amount)
                  FROM UNNEST(credits) c), 0))
    AS total,
  (SUM(CAST(cost * 1000000 AS int64))
    + SUM(IFNULL((SELECT SUM(CAST(c.amount * 1000000 as int64))
                  FROM UNNEST(credits) c), 0))) / 1000000
    AS total_exact
  FROM \`${table[0].metadata.id.replace(':', '.')}\`
  GROUP BY 1
  ORDER BY 1 ASC`

  rows = await sqlQuery(query)
  return rows
}

async function totalInvoice2() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `  
  SELECT
  invoice.month,
  cost_type,
  SUM(cost)
    + SUM(IFNULL((SELECT SUM(c.amount)
                  FROM   UNNEST(credits) c), 0))
    AS total,
  (SUM(CAST(cost * 1000000 AS int64))
    + SUM(IFNULL((SELECT SUM(CAST(c.amount * 1000000 as int64))
                  FROM UNNEST(credits) c), 0))) / 1000000
    AS total_exact
  FROM \`${table[0].metadata.id.replace(':', '.')}\`
  GROUP BY 1, 2
  ORDER BY 1 ASC, 2 ASC`

  rows = await sqlQuery(query)
  rows.forEach(row => console.log(row))
}
async function invoicePerSku() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `  
    SELECT
    sku.description,
    TO_JSON_STRING(labels) as labels,
  cost as cost
  FROM \`${table[0].metadata.id.replace(':', '.')}\``

  rows = await sqlQuery(query)
  rows.forEach(row => console.log(row))
}
async function invoicePerLabel() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `SELECT
  TO_JSON_STRING(labels) as labels,
  sum(cost) as cost
  FROM \`${table[0].metadata.id.replace(':', '.')}\`
  GROUP BY labels;`

  rows = await sqlQuery(query)
  rows.forEach(row => console.log(row))
}
async function invoicePerEnvironment() {
  // Lists all datasets in the specified project
  const [datasets] = await bigquery.getDatasets()
  const [table] = await datasets[0].getTables()
  const query = `SELECT
  labels.value as environment,
  SUM(cost) as cost
  FROM \`${table[0].metadata.id.replace(':', '.')}\`
  LEFT JOIN UNNEST(labels) as labels
    ON labels.key = "environment"
  GROUP BY environment;`

  rows = await sqlQuery(query)
  rows.forEach(row => console.log(row))
}

//queryBillingAccount()
//billingAppEngine()
//totalInvoice()
//totalInvoice2()
//invoicePerSku()
//invoicePerLabel()
//invoicePerEnvironment()

module.exports = { queryBillingAccount, billingAppEngine, totalInvoice, totalInvoice2, invoicePerSku, invoicePerLabel, invoicePerEnvironment }