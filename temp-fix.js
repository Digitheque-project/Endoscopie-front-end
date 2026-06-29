const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const handleSubmit = async \(\) => \{[\s\S]*?setIsSubmitting\(false\);\s*\}\s*\n\s*\};\s*\n/m;

const correctHandleSubmit = `  const handleSubmit = async () => {
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
`;

// wait, the fuzzy matcher deleted parts of it.
// let's look at what's currently in the file.
