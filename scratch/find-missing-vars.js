const fs = require('fs');
const css = fs.readFileSync('public/css/styles.css', 'utf8');

// Find all --* variables defined in :root
const definedVars = new Set();
const varDefRegex = /--[a-zA-Z0-9_-]+/g;

// Let's grab the :root block first
const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
if (rootMatch) {
  const rootContent = rootMatch[1];
  let m;
  while ((m = varDefRegex.exec(rootContent)) !== null) {
    definedVars.add(m[0]);
  }
}

console.log('Defined variables:', Array.from(definedVars));

// Find all var(--*) usages in the file
const varUsageRegex = /var\((--[a-zA-Z0-9_-]+)\)/g;
let match;
let lineNum = 1;
let lastIndex = 0;

for (let i = 0; i < css.length; i++) {
  if (css[i] === '\n') lineNum++;
}

// Reset lineNum track
let lines = css.split('\n');
lines.forEach((line, index) => {
  let m;
  while ((m = varUsageRegex.exec(line)) !== null) {
    const varName = m[1];
    if (!definedVars.has(varName)) {
      console.log(`Error: Used undefined variable "${varName}" on line ${index + 1}: ${line.trim()}`);
    }
  }
});
