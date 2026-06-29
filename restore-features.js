const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Restore dynamic title logic
if (!content.includes('const dynamicTitle')) {
  const dynamicTitleLogic = `
  const dynamicTitle = React.useMemo(() => {
    if (patientName && procedure) {
      return \`Compte rendu \${procedure}\`;
    }
    return "Compte rendu d'endoscopie digestive";
  }, [patientName, procedure]);
`;
  content = content.replace(/const examTypeRef = useRef<HTMLDivElement \| null>\(null\);\s*\n/m, `const examTypeRef = useRef<HTMLDivElement | null>(null);\n${dynamicTitleLogic}\n`);
}

// 2. Use dynamic title
content = content.replace(/<h1 className="mt-3 text-3xl font-bold text-slate-900">Compte rendu d'endoscopie digestive<\/h1>/, `<h1 className="mt-3 text-3xl font-bold text-slate-900">{dynamicTitle}</h1>`);

// 3. Add image upload field
const targetImage = `                      </ul>
                    )}
                  </div>
                </div>

                
              </div>
            </section>`;

const replacementImage = `                      </ul>
                    )}
                  </div>
                  
                  {/* Champ d'importation d'image */}
                  <div className="mt-8">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Images de l'examen</label>
                    <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[160px] w-full">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Cliquez pour importer des images</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, DICOM acceptés (Max 10MB)</p>
                      <input type="file" className="hidden" multiple accept="image/*" />
                    </label>
                  </div>
                </div>

              </div>
            </section>`;

if (content.includes(targetImage)) {
  content = content.replace(targetImage, replacementImage);
} else {
  console.log("Could not find target for image upload. Let me try a regex.");
  const imageRegex = /<\/ul>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
  const imageReplacement = `</ul>
                    )}
                  </div>

                  {/* Champ d'importation d'image */}
                  <div className="mt-8">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Images de l'examen</label>
                    <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[160px] w-full">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Cliquez pour importer des images</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, DICOM acceptés (Max 10MB)</p>
                      <input type="file" className="hidden" multiple accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            </section>`;
  content = content.replace(imageRegex, imageReplacement);
}

fs.writeFileSync(path, content);
console.log('Restored autofill, dynamic title, and image upload.');
