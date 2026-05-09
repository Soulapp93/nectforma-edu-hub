import type { TableColumnKey, BulletinSectionKey } from '@/types/bulletinConfig';

export const SECTIONS: { key: BulletinSectionKey; label: string }[] = [
  { key: 'header', label: 'En-tete' },
  { key: 'student_identity', label: 'Identite etudiant' },
  { key: 'grades_table', label: 'Tableau des notes' },
  { key: 'general_average', label: 'Moyenne generale' },
  { key: 'class_rank', label: 'Rang dans la classe' },
  { key: 'attendance', label: 'Assiduite' },
  { key: 'general_appreciation', label: 'Appreciation generale' },
  { key: 'decision', label: 'Decision (admis / non admis)' },
  { key: 'signatures', label: 'Signatures & cachet' },
  { key: 'legal_notice', label: 'Mentions legales' },
];

export const COLUMNS: { key: TableColumnKey; label: string }[] = [
  { key: 'module', label: 'Module' },
  { key: 'instructor', label: 'Formateur' },
  { key: 'average', label: 'Moyenne' },
  { key: 'cc_average', label: 'Moyenne CC' },
  { key: 'exam_average', label: 'Moyenne Exam' },
  { key: 'coefficient', label: 'Coefficient' },
  { key: 'ects_credits', label: 'Credits ECTS' },
  { key: 'appreciation', label: 'Appreciation' },
  { key: 'class_min', label: 'Note min classe' },
  { key: 'class_max', label: 'Note max classe' },
  { key: 'class_average', label: 'Moyenne classe' },
];

export const FONTS = ['Times New Roman', 'Arial', 'Garamond', 'Montserrat', 'Helvetica', 'Georgia'];
