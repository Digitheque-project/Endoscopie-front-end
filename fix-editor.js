const fs = require('fs');
const path = './components/voice/TranscriptionEditor.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/<div className="relative rounded-2xl border border-slate-200 bg-white[\s\S]*?<\/div>\r?\n      <\/div>/, `<textarea
        className="w-full min-h-[160px] rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="La transcription apparaîtra ici..."
      />`);
fs.writeFileSync(path, content);
