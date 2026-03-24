/**
 * Semester encoding:
 * 1-6 = individual semesters (S1 to S6)
 * Combined options removed for clarity - each module must be assigned to a single semester.
 */

/** Expand a semester value to its constituent semester numbers */
export const expandSemester = (semester: number): number[] => {
  // Legacy support for combined semesters
  if (semester === 12) return [1, 2];
  if (semester === 34) return [3, 4];
  if (semester === 56) return [5, 6];
  return [semester];
};

/** Check if a module's semester matches any of the filter semester numbers */
export const semesterMatchesFilter = (moduleSemester: number | null | undefined, filterSemesterNums: number[]): boolean => {
  if (!moduleSemester) return true; // No semester assigned = show everywhere
  const expanded = expandSemester(moduleSemester);
  return expanded.some(s => filterSemesterNums.includes(s));
};

/** Get semester display label */
export const getSemesterLabel = (semester: number): string => {
  // Legacy support
  if (semester === 12) return 'S1 & S2';
  if (semester === 34) return 'S3 & S4';
  if (semester === 56) return 'S5 & S6';
  return `S${semester}`;
};

/** Get semester badge label (short) */
export const getSemesterBadgeLabel = (semester: number): string => {
  if (semester === 12) return 'S1-S2';
  if (semester === 34) return 'S3-S4';
  if (semester === 56) return 'S5-S6';
  return `S${semester}`;
};

/** Build semester options for a select based on semestersCount - individual semesters only */
export const getSemesterOptions = (semestersCount: number): { value: number; label: string }[] => {
  const options: { value: number; label: string }[] = [];
  for (let i = 1; i <= semestersCount; i++) {
    options.push({ value: i, label: `Semestre ${i}` });
  }
  return options;
};
