const bcrypt = require('bcrypt');

async function main() {
  const staffHash = await bcrypt.hash('staff123', 12);
  const customerHash = await bcrypt.hash('customer123', 12);
  console.log('Staff hash (staff123):   ', staffHash);
  console.log('Customer hash (customer123):', customerHash);
}

main();
