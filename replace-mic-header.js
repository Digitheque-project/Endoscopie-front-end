const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="mb-4 flex items-center gap-3">[\s\S]*?<h2 className="font-manrope text-lg font-bold text-slate-900">Notes complémentaires<\/h2>[\s\S]*?<\/div>\s*<\/div>/;

const replacement = `<div className="mb-6">
              <VoiceRecorder hideTextArea statusIdleText="Notes complémentaires" onFinalTranscript={handleNotesFinalTranscript} />
            </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
