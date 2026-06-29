const fs = require('fs');

const files = [
  './app/checklists/avant/page.tsx',
  './app/checklists/apres/page.tsx',
  './app/checklist-apres-endoscopie/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Regex to match the progress bar block in the footer
  const regex = /\s*<div className="flex-1 mr-12">\s*<div className="flex justify-between items-center mb-2">\s*<span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Progression de la [Cc]hecklist<\/span>[\s\S]*?<\/div>\s*<\/div>/g;

  content = content.replace(regex, '');
  
  // Clean up any justify-between if it was the only thing left on the left side
  // If we remove the flex-1 block, the buttons on the right will just be flex-end or something.
  // Actually, replacing it with an empty string leaves the buttons on the right if flex container is justify-end or if we just let them sit there.
  content = content.replace(/<div className="max-w-\[896px\] mx-auto flex items-center justify-between">/, '<div className="max-w-[896px] mx-auto flex items-center justify-end">');

  fs.writeFileSync(file, content);
}
console.log('Done removing progress bars');
