import { CertificateData } from './CertificateData';
import { PDFGenerator } from './PDFGenerator';

export class PDFCertificateService {
  static generateCertificate(certificateData: CertificateData): string {
    return PDFGenerator.generateCertificateHTML(certificateData);
  }

  static downloadCertificate(certificateData: CertificateData, filename?: string): void {
    PDFGenerator.downloadCertificate(certificateData, filename);
  }

  static generateCertificateText(certificateData: CertificateData): string {
    const issueDate = new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const testTypeFormatted = certificateData.testType.replace('_', ' ').toUpperCase();
    
    return `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                      ║
║                           CERTIFICATE OF COMPLETION                                  ║
║                        Basic Life Support Training Program                           ║
║                                                                                      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  This is to certify that                                                             ║
║                                                                                      ║
║  ${certificateData.participantName.toUpperCase().padEnd(70)} ║
║                                                                                      ║
${certificateData.icNumber ? `║  IC: ${certificateData.icNumber.padEnd(70)} ║` : ''}
${certificateData.jobPosition ? `║  Position: ${certificateData.jobPosition.padEnd(65)} ║` : ''}
║                                                                                      ║
║  has successfully completed the ${testTypeFormatted.padEnd(35)} ║
║  with outstanding performance                                                         ║
║                                                                                      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  SCORE: ${certificateData.score}/${certificateData.totalQuestions} (${certificateData.percentage}%)${' '.repeat(35)} ║
║  GRADE: ${certificateData.grade}${' '.repeat(65)} ║
║                                                                                      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  Certificate ID: ${certificateData.certificateId.padEnd(50)} ║
║  Issued on: ${issueDate.padEnd(55)} ║
║                                                                                      ║
║  This certificate is valid and authentic.                                            ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
    `.trim();
  }

  static generateSimpleCertificate(certificateData: CertificateData): string {
    const issueDate = new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const testTypeFormatted = certificateData.testType.replace('_', ' ').toUpperCase();
    
    return `
CERTIFICATE OF COMPLETION
Basic Life Support Training Program

This is to certify that
${certificateData.participantName}
${certificateData.icNumber ? `IC: ${certificateData.icNumber}` : ''}
${certificateData.jobPosition ? `Position: ${certificateData.jobPosition}` : ''}

has successfully completed the ${testTypeFormatted}
with a score of ${certificateData.score}/${certificateData.totalQuestions} (${certificateData.percentage}%)
Grade: ${certificateData.grade}

Certificate ID: ${certificateData.certificateId}
Issued on: ${issueDate}

This certificate is valid and authentic.
    `.trim();
  }

  static getCertificateAsText(certificateData: CertificateData): string {
    return this.generateCertificateText(certificateData);
  }

  static getSimpleCertificateAsText(certificateData: CertificateData): string {
    return this.generateSimpleCertificate(certificateData);
  }
}