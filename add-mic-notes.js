const fs = require('fs');
const path = './app/prescription-workflow/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const functionToAdd = `
  const handleNotesFinalTranscript = (text: string, meta?: { startsAfterPause?: boolean }) => {
    const normalized = text.trim();
    if (!normalized) return;

    setMedicalNotes((cur) => {
      const out = appendFinalSegment(cur, normalized, Boolean(meta?.startsAfterPause));
      return out;
    });
  };
`;

content = content.replace('const handleCancelEdit = () => {', functionToAdd + '\n  const handleCancelEdit = () => {');

const targetJSX = `<h2 className="font-manrope text-lg font-bold text-slate-900">Notes complémentaires</h2>
                
              </div>
            </div>

            <textarea`;

const replacementJSX = `<h2 className="font-manrope text-lg font-bold text-slate-900">Notes complémentaires</h2>
              </div>
            </div>

            <div className="mb-4">
              <VoiceRecorder hideTextArea statusIdleText="Notes complémentaires" onFinalTranscript={handleNotesFinalTranscript} />
            </div>

            <textarea`;

content = content.replace(targetJSX, replacementJSX);

fs.writeFileSync(path, content);
