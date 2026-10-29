const fs = require('fs');
const path = require('path');
const seed = path.join(__dirname, '..', 'src', 'data', 'academic.seed.json');
const target = path.join(__dirname, '..', 'src', 'data', 'academic.json');
fs.copyFileSync(seed, target);
console.log('Semestre demonstrativo restaurado para a data inicial.');
