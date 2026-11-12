const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

console.log('Building with Supabase config...');
console.log('SUPABASE_URL:', supabaseUrl === 'YOUR_SUPABASE_URL' ? 'Not configured' : 'Configured');
console.log('SUPABASE_ANON_KEY:', supabaseKey === 'YOUR_SUPABASE_ANON_KEY' ? 'Not configured' : 'Configured');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).concat(['assets/app.js']);

files.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return;
  console.log(`Processing ${filename}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/var SUPABASE_URL\s*=\s*['"]YOUR_SUPABASE_URL['"]/g,
    `var SUPABASE_URL = '${supabaseUrl}'`);
  content = content.replace(/var SUPABASE_KEY\s*=\s*['"]YOUR_SUPABASE_ANON_KEY['"]/g,
    `var SUPABASE_KEY = '${supabaseKey}'`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\u2713 Updated ${filename}`);
});

console.log('Build complete!');
