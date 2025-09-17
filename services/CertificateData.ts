export interface CertificateData {
  participantName: string;
  participantEmail: string;
  icNumber?: string;
  jobPosition?: string;
  testType: 'pre_test' | 'post_test';
  score: number;
  totalQuestions: number;
  grade: string;
  percentage: number;
  issuedAt: string;
  certificateId: string;
}

export interface CertificateStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  dangerColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}
