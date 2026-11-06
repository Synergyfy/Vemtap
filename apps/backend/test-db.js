require('dotenv').config({path: '.env'});
const { DataSource } = require('typeorm');
const { dataSourceOptions } = require('./src/database/data-source');

console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USERNAME);
console.log('DB_PASS:', process.env.DB_PASSWORD);

const ds = new (require('typeorm')).DataSource(dataSourceOptions);

ds.initialize()
  .then(() => {
    console.log('Connected to database:', ds.options.database);
    return ds.query('SELECT 1');
  })
  .then(res => {
    console.log('Query result:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
