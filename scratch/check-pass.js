const bcrypt = require('bcrypt');

const hash = '$2b$12$LJ3m4ys3Lz0YBNKqxZvKheZbGFGvcejYe5.nF.FPqfLkB1mRdKYVK';
bcrypt.compare('staff123', hash).then(res => {
  console.log('staff123 matches:', res);
});
bcrypt.compare('admin123', hash).then(res => {
  console.log('admin123 matches:', res);
});
bcrypt.compare('admin', hash).then(res => {
  console.log('admin matches:', res);
});
bcrypt.compare('staff', hash).then(res => {
  console.log('staff matches:', res);
});
