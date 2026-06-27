const fs = require('fs');
const cssParser = require('css');

const cssContent = fs.readFileSync('public/css/styles.css', 'utf8');

try {
  const ast = cssParser.parse(cssContent, { silent: false, source: 'public/css/styles.css' });
  console.log('No parsing errors found by css parser.');
} catch (err) {
  console.error('Parsing error caught:', err.message);
  console.error(err.stack);
}
