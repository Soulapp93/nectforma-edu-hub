import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile, UserDocument } from './dossierService';

const NECT_BLUE = [30, 30, 90] as const;
const NECT_LIGHT = [124, 58, 237] as const;
const GRAY = [107, 114, 128] as const;

function addHeader(doc: jsPDF, profile: UserProfile) {
  // Top bar
  doc.setFillColor(...NECT_BLUE);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('NECTFORMA', 15, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Dossier Administratif', 15, 24);

  // Name on right
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${profile.first_name} ${profile.last_name}`, 195, 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.role} • ${profile.email}`, 195, 24, { align: 'right' });

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Genere le ${today}`, 195, 31, { align: 'right' });
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...NECT_LIGHT);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, y + 5.5);
  return y + 14;
}

function addInfoRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 20, y);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(value || '—', 75, y);

  return y + 6;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 30): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('NECTFORMA - Dossier administratif confidentiel', 15, 289);
    doc.text(`Page ${i} / ${pageCount}`, 195, 289, { align: 'right' });
  }
}

export function exportDossierPDF(
  profile: UserProfile,
  formations: any[],
  transcripts: any[],
  contracts: any[],
  userDocuments: UserDocument[],
  formateurModules?: any[]
) {
  const doc = new jsPDF();

  // Header
  addHeader(doc, profile);
  let y = 48;

  // Section 1: Informations civiles
  y = addSectionTitle(doc, y, 'INFORMATIONS CIVILES');
  y = addInfoRow(doc, y, 'Prenom', profile.first_name);
  y = addInfoRow(doc, y, 'Nom', profile.last_name);
  y = addInfoRow(doc, y, 'Email', profile.email || '');
  y = addInfoRow(doc, y, 'Telephone', profile.phone || '');
  y = addInfoRow(doc, y, 'Date de naissance', formatDate(profile.date_of_birth));
  y = addInfoRow(doc, y, 'Sexe', profile.gender === 'M' ? 'Masculin' : profile.gender === 'F' ? 'Feminin' : (profile.gender || ''));
  y = addInfoRow(doc, y, 'Nationalite', profile.nationality || '');
  y = addInfoRow(doc, y, 'Adresse', [profile.address, profile.postal_code, profile.city].filter(Boolean).join(', '));
  y = addInfoRow(doc, y, 'Pays', profile.country || '');
  y = addInfoRow(doc, y, 'Statut', profile.status || 'Actif');
  y = addInfoRow(doc, y, 'Inscrit le', formatDate(profile.created_at));
  y += 6;

  // Section 2: Informations pedagogiques
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, y, 'INFORMATIONS PEDAGOGIQUES');

  if (formations.length > 0) {
    const formationRows = formations.map((f: any) => [
      f.formations?.title || 'Formation',
      f.formations?.level || '—',
      f.formations?.formation_type || '—',
      f.formations?.start_date ? `${formatDate(f.formations.start_date)} - ${formatDate(f.formations.end_date)}` : '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [[profile.role === 'Formateur' ? 'Formation dispensee' : 'Formation inscrite', 'Niveau', 'Type', 'Periode']],
      body: formationRows,
      margin: { left: 20, right: 15 },
      headStyles: { fillColor: [...NECT_BLUE] as [number, number, number], fontSize: 8, font: 'helvetica' },
      bodyStyles: { fontSize: 8, font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.text('Aucune formation associee', 20, y);
    y += 8;
  }

  // Formateur: modules
  if (profile.role === 'Formateur' && formateurModules && formateurModules.length > 0) {
    y = checkPageBreak(doc, y, 20);
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Modules et specialites :', 20, y);
    y += 5;
    const uniqueModules = [...new Set(formateurModules.map((m: any) => m.formation_modules?.title).filter(Boolean))];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(uniqueModules.join(', ') || 'Aucun module', 20, y);
    y += 8;
  }

  // Student: transcripts
  if (profile.role === 'Étudiant' && transcripts.length > 0) {
    y = checkPageBreak(doc, y, 30);
    const transcriptRows = transcripts.map((t: any) => [
      (t.formations as any)?.title || 'Formation',
      t.semester || '—',
      t.academic_year || '—',
      t.gpa ? String(t.gpa) : '—',
      t.total_ects ? String(t.total_ects) : '—',
      t.status === 'published' ? 'Publie' : 'Brouillon',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Formation', 'Semestre', 'Annee', 'Moyenne', 'ECTS', 'Statut']],
      body: transcriptRows,
      margin: { left: 20, right: 15 },
      headStyles: { fillColor: [...NECT_BLUE] as [number, number, number], fontSize: 8, font: 'helvetica' },
      bodyStyles: { fontSize: 8, font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 3: Documents & Contrats
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, y, 'DOCUMENTS & CONTRATS');

  if (contracts.length > 0) {
    const contractRows = contracts.map((c: any) => [
      c.title || c.contract_type || 'Contrat',
      c.contract_type || '—',
      formatDate(c.start_date),
      formatDate(c.end_date),
      c.is_active ? 'Actif' : 'Termine',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Titre', 'Type', 'Debut', 'Fin', 'Statut']],
      body: contractRows,
      margin: { left: 20, right: 15 },
      headStyles: { fillColor: [...NECT_BLUE] as [number, number, number], fontSize: 8, font: 'helvetica' },
      bodyStyles: { fontSize: 8, font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  if (userDocuments.length > 0) {
    y = checkPageBreak(doc, y, 30);
    const docTypeLabels: Record<string, string> = {
      contrat_alternance: 'Contrat alternance', contrat_stage: 'Contrat de stage',
      contrat_pro: 'Contrat pro.', convention: 'Convention', diplome: 'Diplome',
      releve_notes: 'Releve de notes', cv: 'CV', autre: 'Autre',
    };
    const docRows = userDocuments.map(d => [
      d.title,
      docTypeLabels[d.document_type] || d.document_type,
      d.file_name || '—',
      formatDate(d.created_at),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Titre', 'Type', 'Fichier', 'Date']],
      body: docRows,
      margin: { left: 20, right: 15 },
      headStyles: { fillColor: [...NECT_BLUE] as [number, number, number], fontSize: 8, font: 'helvetica' },
      bodyStyles: { fontSize: 8, font: 'helvetica' },
      alternateRowStyles: { fillColor: [248, 248, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  if (contracts.length === 0 && userDocuments.length === 0) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.text('Aucun document ou contrat', 20, y);
    y += 8;
  }

  // Section 4: Historique
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, y, 'HISTORIQUE & TRACABILITE');

  const events: { date: string; label: string }[] = [];
  if (profile.created_at) events.push({ date: profile.created_at, label: 'Inscription dans l\'etablissement' });
  formations.forEach((f: any) => {
    if (f.formations?.start_date) events.push({ date: f.formations.start_date, label: `Affecte a : ${f.formations.title}` });
  });
  transcripts.forEach((t: any) => {
    events.push({ date: t.created_at, label: `Releve de notes : ${(t.formations as any)?.title || 'Formation'} - ${t.semester}` });
  });
  userDocuments.forEach(d => {
    events.push({ date: d.created_at, label: `Document depose : ${d.title}` });
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length > 0) {
    events.forEach(ev => {
      y = checkPageBreak(doc, y, 10);
      doc.setFillColor(...NECT_LIGHT);
      doc.circle(23, y - 1, 1.5, 'F');
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(ev.label, 30, y);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.text(formatDate(ev.date), 170, y);
      y += 7;
    });
  } else {
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.text('Aucun evenement enregistre', 20, y);
  }

  // Footers
  addFooter(doc);

  // Save
  const fileName = `dossier_${profile.last_name}_${profile.first_name}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
