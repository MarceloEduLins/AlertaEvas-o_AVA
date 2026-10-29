const repository = require('../src/repositories/academic.repository');
const { validateAcademicData } = require('../src/services/data-validation.service');

const result = validateAcademicData(repository.readData());
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
