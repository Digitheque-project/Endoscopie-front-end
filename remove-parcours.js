const fs = require('fs');
const path = './app/planification-examens/page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Define regex to match the "Parcours de soins" section
  const regex = /\s*\{\/\*\s*Parcours de soins\s*\*\/\}\s*<div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant\/30">[\s\S]*?<\/ul>\s*<\/div>/g;
  
  content = content.replace(regex, '');
  
  fs.writeFileSync(path, content);
  console.log('Removed Parcours de soins in planification-examens');
} else {
  console.log('File not found');
}
