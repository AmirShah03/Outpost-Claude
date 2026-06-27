const fs = require('fs');
const css = fs.readFileSync('public/css/styles.css', 'utf8');

// check brace matches
let depth = 0;
let lineNum = 1;
let inComment = false;
let inString = false;
let stringChar = null;

for (let i = 0; i < css.length; i++) {
  const char = css[i];
  const nextChar = css[i+1];
  
  if (char === '\n') {
    lineNum++;
  }
  
  if (inComment) {
    if (char === '*' && nextChar === '/') {
      inComment = false;
      i++;
    }
    continue;
  }
  
  if (inString) {
    if (char === stringChar && css[i-1] !== '\\') {
      inString = false;
    }
    continue;
  }
  
  if (char === '/' && nextChar === '*') {
    inComment = true;
    i++;
    continue;
  }
  
  if (char === '"' || char === "'") {
    inString = true;
    stringChar = char;
    continue;
  }
  
  if (char === '{') {
    depth++;
  } else if (char === '}') {
    depth--;
    if (depth < 0) {
      console.log(`Error: Extra closing brace at line ${lineNum}`);
      process.exit(1);
    }
  }
}

if (depth > 0) {
  console.log(`Error: Unclosed opening brace. Remaining depth: ${depth}`);
  process.exit(1);
}

if (inComment) {
  console.log('Error: Unclosed comment at end of file');
  process.exit(1);
}

console.log('Basic syntax check passed (braces and comments match).');
