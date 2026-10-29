const path = require('path');
const { execFile } = require('child_process');
const { buildFeatureRows } = require('./academic.service');

function pythonCandidates() {
  const configured = process.env.PYTHON_BIN?.trim();
  const candidates = [];
  if (configured) candidates.push({ command: configured, prefix: [] });

  if (process.platform === 'win32') {
    candidates.push(
      { command: 'py', prefix: ['-3'] },
      { command: 'python', prefix: [] },
      { command: 'python3', prefix: [] }
    );
  } else {
    candidates.push(
      { command: 'python3', prefix: [] },
      { command: 'python', prefix: [] },
      { command: 'py', prefix: ['-3'] }
    );
  }

  return candidates.filter((item, index, array) =>
    array.findIndex((other) => other.command === item.command && other.prefix.join(' ') === item.prefix.join(' ')) === index
  );
}

function executePython({ input = null, args = [] } = {}) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '..', '..', 'scripts', 'cluster_students.py');
    const candidates = pythonCandidates();
    const failures = [];

    function attempt(index) {
      if (index >= candidates.length) {
        const detail = failures.length ? ` Detalhes: ${failures.join(' | ')}` : '';
        reject(new Error(`Python com NumPy e scikit-learn não foi encontrado.${detail}`));
        return;
      }

      const candidate = candidates[index];
      const child = execFile(
        candidate.command,
        [...candidate.prefix, script, ...args],
        { maxBuffer: 2 * 1024 * 1024, timeout: 20000 },
        (error, stdout, stderr) => {
          if (error) {
            failures.push(`${candidate.command}: ${(stderr || error.message).trim().slice(0, 220)}`);
            attempt(index + 1);
            return;
          }
          try {
            resolve({
              command: [candidate.command, ...candidate.prefix].join(' '),
              data: JSON.parse(stdout)
            });
          } catch (parseError) {
            failures.push(`${candidate.command}: resposta inválida (${parseError.message})`);
            attempt(index + 1);
          }
        }
      );

      if (input !== null) child.stdin.end(JSON.stringify(input));
      else child.stdin.end();
    }

    attempt(0);
  });
}

async function checkPython() {
  try {
    const result = await executePython({ args: ['--health'] });
    return { ok: true, command: result.command, ...result.data };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

async function clusterClass(classId) {
  const rows = buildFeatureRows(classId);
  const result = await executePython({ input: rows });
  return { ...result.data, pythonCommand: result.command, rows };
}

module.exports = { clusterClass, checkPython, pythonCandidates };
