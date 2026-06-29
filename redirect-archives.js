const fs = require('fs');
const path = './app/resultat-endoscopie/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add clearPatientData to usePatient destructuring
content = content.replace(
  /const \{ patientId, prescriptionId, patientName, procedure, age, prescriber \} = usePatient\(\);/,
  `const { patientId, prescriptionId, patientName, procedure, age, prescriber, clearPatientData } = usePatient();`
);

// 2. Modify handleSubmit to clear context and redirect to /archives
const targetSubmit = `      setIsSuccess(true);
      setTimeout(() => {
        router.push("/rapport");
      }, 1200);`;

const replacementSubmit = `      setIsSuccess(true);
      setTimeout(() => {
        clearPatientData();
        router.push("/archives");
      }, 1200);`;

content = content.replace(targetSubmit, replacementSubmit);

fs.writeFileSync(path, content);
