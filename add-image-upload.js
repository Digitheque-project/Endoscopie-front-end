const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">`;

const replacementStr = `                  </div>
                  
                  {/* Champ d'importation d'image */}
                  <div className="mt-8">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Images de l'examen</label>
                    <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[160px]">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Cliquez pour importer des images</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG acceptés (Max 10MB)</p>
                      <input type="file" className="hidden" multiple accept="image/*" />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content);
console.log("Added image upload field.");
