const fs = require('fs');

const files = [
  './app/prescription-workflow/page.tsx',
  './app/checklists/apres/page.tsx'
];

for (const path of files) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Replace justify-between with justify-end AND remove the flex-1 block
    content = content.replace(/<div className="max-w-\[896px\] mx-auto flex items-center justify-between">[\s\S]*?<div className="flex-1 mr-12[\s\S]*?w-.*? rounded-full" \/>\s*<\/div>\s*<\/div>/, '<div className="max-w-[896px] mx-auto flex items-center justify-end">');
    
    fs.writeFileSync(path, content);
    console.log(`Replaced in ${path}`);
  } else {
    console.log(`File not found: ${path}`);
  }
}
