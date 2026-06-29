const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove subtitle under Notes médicales
content = content.replace(/<p className="text-sm text-slate-500">Informations cliniques importantes à transmettre à l&apos;équipe d&apos;endoscopie\.<\/p>/, '');

// Remove placeholder inside the textarea
content = content.replace(/placeholder="Saisir ici les notes médicales, le contexte clinique, les traitements à surveiller ou toute observation pertinente\.\.\."/, 'placeholder=""');

fs.writeFileSync(path, content);
