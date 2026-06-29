const fs = require('fs');

const files = [
  './app/patient-dossier/page.tsx',
  './app/patient-dossier/[id]/page.tsx'
];

for (const path of files) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // The target is the Parcours de soins section
    const regex = /\s*\{\/\*\s*Parcours de soins\s*\*\/\}\s*<section className="bg-white rounded-2xl shadow-sm border border-outline-variant\/20 p-6">[\s\S]*?<\/section>/g;
    
    content = content.replace(regex, '');
    fs.writeFileSync(path, content);
    console.log(`Removed in ${path}`);
  }
}
