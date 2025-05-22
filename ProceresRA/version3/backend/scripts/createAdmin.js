require('dotenv').config({ path: '../.env' });
const initAdminUser = require('../src/config/initialAdmin');

initAdminUser().then(() => process.exit(0));