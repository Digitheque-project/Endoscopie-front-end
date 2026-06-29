const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const corruptedRegex = /        \.\.\.\(prev\[section\] as object\),\s*<div className="max-w-\[1100px\] w-full px-4 py-8">/;

const restoredCode = `        ...(prev[section] as object),
        [key]: value,
      },
    } as CompteRenduEndoscopie));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!prescriptionId || !patientId) return;

      const payload = {
        prescriptionId,
        patientId,
        ...formData,
      };

      await apiFetch("/api/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsSuccess(true);
      setTimeout(() => {
        clearPatientData();
        router.push("/archives");
      }, 1200);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du compte rendu :", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 pb-24">
      <div className="flex justify-center">
        <div className="max-w-[1100px] w-full px-4 py-8">`;

content = content.replace(corruptedRegex, restoredCode);

fs.writeFileSync(path, content);
