const fs = require('fs');
const path = '../endoscopie-back/src/app.service.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /    return this\.prisma\.resultatEndoscopie\.upsert\(\{\n      where: \{ prescriptionId: data\.prescriptionId \},\n      update: resultatData,\n      create: \{\n        \.\.\.resultatData,\n        serviceId,\n        prescriptionId: data\.prescriptionId,\n        patientId: data\.patientId,\n      \},\n    \}\);/m;

const replacement = `    const resultat = await this.prisma.resultatEndoscopie.upsert({
      where: { prescriptionId: data.prescriptionId },
      update: resultatData,
      create: {
        ...resultatData,
        serviceId,
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
      },
    });

    // Mettre à jour le statut de la prescription à Terminé/Archivé
    await this.prisma.prescription.updateMany({
      where: { id: data.prescriptionId, serviceId },
      data: { statut: 'Terminé' },
    });

    return resultat;`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
