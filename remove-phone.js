const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">\s*<p className="text-xs uppercase tracking-\[0\.3em\] text-slate-500 font-bold">Téléphone<\/p>\s*<div className="mt-4 space-y-3">\s*\{examTypes\.map\(\(exam\) => \(\s*<div\s*key=\{exam\.value\}\s*className=\{`rounded-2xl border px-4 py-3 \$\{formData\.typeExamen === exam\.value \? 'border-primary bg-white' : 'border-transparent bg-slate-100'\}`\}\s*>\s*<p className="font-semibold text-slate-900">\{exam\.label\}<\/p>\s*<p className="text-sm text-slate-600">\{exam\.phone\}<\/p>\s*<\/div>\s*\)\)\}\s*<\/div>\s*<\/div>/;

const replacement = `<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    {examTypes.map((exam) => (
                      <div
                        key={exam.value}
                        className={\`rounded-2xl border px-4 py-3 \${formData.typeExamen === exam.value ? 'border-primary bg-white' : 'border-transparent bg-slate-100'}\`}
                      >
                        <p className="font-semibold text-slate-900">{exam.label}</p>
                      </div>
                    ))}
                  </div>
                </div>`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(path, content);
