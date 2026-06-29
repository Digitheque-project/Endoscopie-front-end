const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `<div className="mt-4 text-xs text-slate-500">Utilise l&apos;API vocale du navigateur. Fonctionne surtout sur les navigateurs Chromium compatibles.</div>
            </div>`;

const replaceStr = `<div className="mt-4 text-xs text-slate-500">Utilise l&apos;API vocale du navigateur. Fonctionne surtout sur les navigateurs Chromium compatibles.</div>
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-end">
                <button onClick={handleClearEditor} type="button" className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors">Effacer la transcription</button>
                <button onClick={() => handleSaveTranscription(transcriptText)} type="button" className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">Enregistrer la transcription</button>
                <button onClick={handleSaveEditor} type="button" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">Ajouter aux notes médicales</button>
              </div>
            </div>`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(path, content);
