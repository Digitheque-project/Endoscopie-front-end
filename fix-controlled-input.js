const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix loadData
const targetLoadRendezVous = `            rendezVous: {
              endoscope: data.rendezVous?.endoscope || prev.rendezVous.endoscope,
              preDesinfection: data.rendezVous?.preDesinfection || prev.rendezVous.preDesinfection,
              kitLigature: data.rendezVous?.kitLigature || prev.rendezVous.kitLigature,
              elastiquesCharges:
                data.rendezVous?.elastiquesCharges !== undefined
                  ? Number(data.rendezVous.elastiquesCharges)
                  : prev.rendezVous.elastiquesCharges,
              elastiquesUtilises:
                data.rendezVous?.elastiquesUtilises !== undefined
                  ? String(data.rendezVous.elastiquesUtilises)
                  : prev.rendezVous.elastiquesUtilises,
            },`;

const replacementLoadRendezVous = `            rendezVous: {
              ...prev.rendezVous,
              endoscope: data.rendezVous?.endoscope || prev.rendezVous.endoscope,
              preDesinfection: data.rendezVous?.preDesinfection || prev.rendezVous.preDesinfection,
              desinfection: data.rendezVous?.desinfection || prev.rendezVous.desinfection || "",
              kitLigature: data.rendezVous?.kitLigature || prev.rendezVous.kitLigature,
              elastiquesCharges:
                data.rendezVous?.elastiquesCharges !== undefined
                  ? Number(data.rendezVous.elastiquesCharges)
                  : prev.rendezVous.elastiquesCharges,
              elastiquesUtilises:
                data.rendezVous?.elastiquesUtilises !== undefined
                  ? String(data.rendezVous.elastiquesUtilises)
                  : prev.rendezVous.elastiquesUtilises,
            },`;

content = content.replace(targetLoadRendezVous, replacementLoadRendezVous);

// 2. Fix the input just in case
const targetInput = `                  <input
                    value={formData.rendezVous.desinfection}
                    onChange={(e) => updateNested("rendezVous", "desinfection", e.target.value)}
                    placeholder="Saisir la désinfection"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />`;

const replacementInput = `                  <input
                    value={formData.rendezVous.desinfection || ""}
                    onChange={(e) => updateNested("rendezVous", "desinfection", e.target.value)}
                    placeholder="Saisir la désinfection"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />`;

content = content.replace(targetInput, replacementInput);

fs.writeFileSync(path, content);
console.log("Fixed controlled input issue.");
