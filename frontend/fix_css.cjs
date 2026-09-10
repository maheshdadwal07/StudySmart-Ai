const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace background: #fff; with background: var(--surface);
  content = content.replace(/background:\s*#fff(?:fff)?;/ig, 'background: var(--surface);');
  
  // Replace background: #fafafa; with background: var(--surface-hover);
  content = content.replace(/background:\s*#fafafa;/ig, 'background: var(--surface-hover);');

  fs.writeFileSync(filePath, content);
  console.log(`Processed ${filePath}`);
}

const stylesDir = path.join(__dirname, 'src', 'styles');
const files = ['landing.css', 'dashboard.css', 'settings.css', 'study.css', 'question.css'];

files.forEach(file => {
  const filePath = path.join(stylesDir, file);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  }
});
