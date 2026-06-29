const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /<div className="mt-2">\s*<div className="text-xs text-slate-500">Aperçu \(transcription en temps réel\)<\/div>\s*<div className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm text-slate-700 leading-5 space-y-1">\{liveTranscript \|\| "\(?aucune dictée en cours\)?\"\}<\/div>\s*<\/div>\s*<div className="mt-4 text-xs text-slate-500">Utilise l&apos;API vocale du navigateur\. Fonctionne surtout sur les navigateurs Chromium compatibles\.<\/div>/;

const replacement = `<div className="mt-2">
                <div className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 min-h-[100px] text-sm text-slate-700 leading-5 space-y-1">{liveTranscript}</div>
              </div>`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(path, content);
