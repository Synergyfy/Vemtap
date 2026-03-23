const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Daniel\\Documents\\workspace\\entryconect\\apps\\VemTap\\store\\useBusinessFormsStore.ts', 'utf8');
const lines = content.split('\n');
let openBraces = 0;
let openParens = 0;

lines.forEach((line, index) => {
    for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
    }
    if (openBraces < 0 || openParens < 0) {
        console.log(`Mismatch at line ${index + 1}: Braces: ${openBraces}, Parens: ${openParens}`);
    }
});

console.log(`Final counts: Braces: ${openBraces}, Parens: ${openParens}`);
