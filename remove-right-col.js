const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The replacement should be done by targeting the entire section
const targetRegex = /<section className="grid gap-6 lg:grid-cols-\[1\.2fr_0\.8fr\]">([\s\S]*?)<\/section>/;

const replacement = `<section className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:p-7">
              <VoiceRecorder onTranscriptChange={handleTranscriptChange} onFinalTranscript={handleFinalTranscript} onManualPause={handleManualPause} onAudio={handleAudioReady} exposeControls={setControls} />
              <div className="mt-2">
                <div className="text-xs text-slate-500">Aperçu (transcription en temps réel)</div>
                <div className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm text-slate-700 leading-5 space-y-1">{liveTranscript || "(aucune dictée en cours)"}</div>
              </div>
              <div className="mt-4 text-xs text-slate-500">Utilise l&apos;API vocale du navigateur. Fonctionne surtout sur les navigateurs Chromium compatibles.</div>
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 pt-4">
                <button onClick={handleClearEditor} type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">Effacer la transcription</button>
                <button onClick={() => handleSaveTranscription(transcriptText)} type="button" className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">Enregistrer la transcription</button>
                <button onClick={handleSaveEditor} type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Ajouter aux notes médicales</button>
              </div>
            </div>
          </section>`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(path, content);
