import { CertificateStyle } from './CertificateData';

export const DEFAULT_CERTIFICATE_STYLE: CertificateStyle = {
  primaryColor: '#1e40af', // Blue
  secondaryColor: '#6b7280', // Gray
  accentColor: '#22c55e', // Green
  dangerColor: '#ef4444', // Red
  backgroundColor: '#f8fafc', // Light gray
  textColor: '#1f2937', // Dark gray
  borderColor: '#1e40af', // Blue
};

export const getGradeColor = (grade: string): string => {
  if (grade.includes('A')) return '#22c55e'; // Green
  if (grade.includes('B')) return '#1e40af'; // Blue
  if (grade.includes('C')) return '#f59e0b'; // Orange
  return '#ef4444'; // Red for D, E, F
};

export const getTestTypeColor = (testType: string): string => {
  return testType === 'pre_test' ? '#3b82f6' : '#10b981';
};
