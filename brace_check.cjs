const fs = require('fs');
const content = fs.readFileSync('c:/laragon/www/siarsad/src/pages/arsip/TemplateSurat.jsx', 'utf8');
let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') open++;
  if (content[i] === '}') close++;
}
console.log(`Braces: { ${open}, } ${close}`);

let openP = 0;
let closeP = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '(') openP++;
  if (content[i] === ')') closeP++;
}
console.log(`Parentheses: ( ${openP}, ) ${closeP}`);
