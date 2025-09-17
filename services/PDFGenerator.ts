// PDF Generation using HTML to PDF conversion
import { CertificateData } from './CertificateData';
import { getGradeColor, getTestTypeColor } from './CertificateStyles';

export class PDFGenerator {
  static generateCertificateHTML(certificateData: CertificateData): string {
    const issueDate = new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const testTypeFormatted = certificateData.testType.replace('_', ' ').toUpperCase();
    const gradeColor = getGradeColor(certificateData.grade);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate - ${certificateData.participantName}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: #f8fafc;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .certificate {
            width: 95%;
            height: 90%;
            background: white;
            border: 3px solid #1e40af;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 1px solid #1e40af;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
            border-radius: 8px 8px 0 0;
        }
        .medal-icon {
            font-size: 40px;
            margin-bottom: 15px;
            display: block;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
            letter-spacing: 1px;
        }
        .subtitle {
            font-size: 16px;
            margin: 0 0 15px 0;
            opacity: 0.9;
        }
        .header-divider {
            width: 60px;
            height: 2px;
            background: white;
            margin: 0 auto;
            opacity: 0.8;
        }
        .content {
            flex: 1;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        .certificate-text {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        .participant-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 20px 0;
            text-transform: uppercase;
        }
        .participant-details {
            font-size: 14px;
            color: #6b7280;
            margin: 10px 0;
        }
        .completion-text {
            font-size: 16px;
            color: #6b7280;
            margin: 20px 0;
        }
        .score-grade-section {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 40px 0;
        }
        .score-box, .grade-box {
            border: 2px solid;
            padding: 15px 20px;
            text-align: center;
            min-width: 120px;
        }
        .score-box {
            border-color: #1e40af;
            color: #1e40af;
        }
        .grade-box {
            border-color: ${gradeColor};
            color: ${gradeColor};
        }
        .box-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .box-value {
            font-size: 20px;
            font-weight: bold;
        }
        .box-percentage {
            font-size: 10px;
            margin-top: 5px;
        }
        .footer {
            padding: 25px 40px;
            background: #f8fafc;
            border-top: 1px solid #e5e7eb;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        .footer-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #6b7280;
        }
        .footer-icon {
            font-size: 14px;
        }
        .footer-label {
            font-weight: 500;
        }
        .footer-value {
            font-weight: 600;
        }
        .status-issued {
            color: #10b981;
            font-weight: bold;
        }
        .completion-statement {
            text-align: center;
            font-size: 16px;
            color: #6b7280;
            margin: 20px 0 10px 0;
        }
        .validity-text {
            text-align: center;
            font-style: italic;
            font-size: 14px;
            margin: 10px 0 20px 0;
        }
        .decoration {
            position: absolute;
            width: 16px;
            height: 16px;
            background: #1e40af;
            border-radius: 50%;
        }
        .decoration.left-1 { top: 60px; left: 30px; }
        .decoration.left-2 { top: 100px; left: 30px; width: 12px; height: 12px; }
        .decoration.left-3 { top: 140px; left: 30px; width: 8px; height: 8px; }
        .decoration.right-1 { top: 60px; right: 30px; }
        .decoration.right-2 { top: 100px; right: 30px; width: 12px; height: 12px; }
        .decoration.right-3 { top: 140px; right: 30px; width: 8px; height: 8px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="medal-icon">🏅</div>
            <div class="title">CERTIFICATE OF ACHIEVEMENT</div>
            <div class="subtitle">Basic Life Support Training Program</div>
            <div class="header-divider"></div>
        </div>
        
        <div class="content">
            <div class="decoration left-1"></div>
            <div class="decoration left-2"></div>
            <div class="decoration left-3"></div>
            <div class="decoration right-1"></div>
            <div class="decoration right-2"></div>
            <div class="decoration right-3"></div>
            
            <div class="certificate-text">This is to certify that</div>
            
            <div class="participant-name">${certificateData.participantName}</div>
            
            ${certificateData.icNumber ? `<div class="participant-details">IC: ${certificateData.icNumber}</div>` : ''}
            ${certificateData.jobPosition ? `<div class="participant-details">Position: ${certificateData.jobPosition}</div>` : ''}
            
            <div class="completion-text">
                has successfully completed the ${testTypeFormatted}<br>
                with outstanding performance
            </div>
            
            <div class="score-grade-section">
                <div class="score-box">
                    <div class="box-label">SCORE</div>
                    <div class="box-value">${certificateData.score}/${certificateData.totalQuestions}</div>
                    <div class="box-percentage">(${certificateData.percentage}%)</div>
                </div>
                <div class="grade-box">
                    <div class="box-label">GRADE</div>
                    <div class="box-value">${certificateData.grade}</div>
                </div>
            </div>
            
            <div class="completion-statement">and is hereby awarded this certificate of completion.</div>
            <div class="validity-text">This certificate is valid and authentic.</div>
        </div>
        
        <div class="footer">
            <div class="footer-grid">
                <div class="footer-item">
                    <span class="footer-icon">📅</span>
                    <span class="footer-label">Completion Date:</span>
                    <span class="footer-value">${issueDate}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-icon">📄</span>
                    <span class="footer-label">Certificate ID:</span>
                    <span class="footer-value">${certificateData.certificateId.substring(0, 8).toUpperCase()}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-icon">📧</span>
                    <span class="footer-label">Email:</span>
                    <span class="footer-value">${certificateData.participantEmail}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-icon">✅</span>
                    <span class="footer-label">Status:</span>
                    <span class="footer-value status-issued">ISSUED</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  static downloadCertificate(certificateData: CertificateData, filename?: string): void {
    const html = this.generateCertificateHTML(certificateData);
    const defaultFilename = `Certificate_${certificateData.participantName.replace(/\s+/g, '_')}_${certificateData.testType}.pdf`;
    
    try {
      // Try to open in new window for web browsers
      if (typeof window !== 'undefined' && window.open) {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          // Wait for content to load, then trigger print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Don't close immediately, let user see the result
            }, 1000);
          };
          return;
        }
      }
      
      // Fallback: Create a blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFilename.replace('.pdf', '.html');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      // Final fallback: show in alert
      throw new Error('Unable to generate certificate. Please try again.');
    }
  }

  static getCertificateAsHTML(certificateData: CertificateData): string {
    return this.generateCertificateHTML(certificateData);
  }
}