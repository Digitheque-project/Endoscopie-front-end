const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Telephone block
const phoneBlockRegex = /<div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">\s*<p className="text-xs uppercase tracking-\[0\.3em\] text-slate-500 font-bold">Téléphone<\/p>\s*<div className="mt-4 space-y-3">\s*\{examTypes\.map\(\(exam\) => \([\s\S]*?<\/div>\s*\)\)\}\s*<\/div>\s*<\/div>/g;
content = content.replace(phoneBlockRegex, '');

// Since the phone block was the second column, let's also remove the grid layout for it so it doesn't leave an empty column.
const gridLayoutRegex = /<div className="grid gap-6 lg:grid-cols-\[1fr_280px\]">/g;
content = content.replace(gridLayoutRegex, '<div className="grid gap-6">');

// 2. Add Autofill useEffect
const autoFillEffect = `

  // Autofill patient and prescriber data
  useEffect(() => {
    setFormData(prev => {
      // Only auto-fill if not already filled
      if (!prev.responsable.nom && patientName) {
        const parts = patientName.split(' ');
        const nom = parts[0] || '';
        const prenoms = parts.slice(1).join(' ') || '';
        return {
          ...prev,
          responsable: {
            ...prev.responsable,
            nom,
            prenoms,
            age: age ? parseInt(age, 10) : prev.responsable.age,
            prescripteur: prescriber || prev.responsable.prescripteur,
            indication: procedure || prev.responsable.indication,
          }
        };
      }
      return prev;
    });
  }, [patientName, age, prescriber, procedure]);

`;

// Insert it right after the loadData useEffect (around line 276)
content = content.replace(/  \}, \[prescriptionId\]\);\s*\n/m, `  }, [prescriptionId]);\n${autoFillEffect}`);

// 3. Fix loadData missing desinfection (I'll just use a safer replace)
const loadRendezVousRegex = /rendezVous: \{\s*endoscope: data\.rendezVous\?\.endoscope \|\| prev\.rendezVous\.endoscope,\s*preDesinfection: data\.rendezVous\?\.preDesinfection \|\| prev\.rendezVous\.preDesinfection,/m;
const loadRendezVousReplacement = `rendezVous: {
              ...prev.rendezVous,
              endoscope: data.rendezVous?.endoscope || prev.rendezVous.endoscope,
              preDesinfection: data.rendezVous?.preDesinfection || prev.rendezVous.preDesinfection,
              desinfection: data.rendezVous?.desinfection || prev.rendezVous.desinfection || "",`;
content = content.replace(loadRendezVousRegex, loadRendezVousReplacement);

fs.writeFileSync(path, content);
console.log('Script completed.');
