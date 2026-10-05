const fs = require('node:fs'), path = require('node:path');
// Optional effects must not prevent the timeline/controller from initializing.
const optional = new Set(['browser-startup.js','scene-resources.js','partner-road.js',
  'invitation-handoff.js','aarti-flowers.js','garba-circle.js','event-crowds.js',
  'elephant-walk.js','site-soundtrack.js','ios-autoscroll.js','button-motion.js','browser-safety.js']);
module.exports = (dist, names, extension) => names.map(name => {
  const source = fs.readFileSync(path.join(dist,name),'utf8');
  const body = extension === 'js' && optional.has(name)
    ? `try {\n${source}\n} catch (error) { console.warn(${JSON.stringify('Optional effect unavailable: '+name)}, error); }\n`
    : source;
  return `/* ${name} */\n${body}`;
}).join(extension === 'js' ? '\n;\n' : '\n');
