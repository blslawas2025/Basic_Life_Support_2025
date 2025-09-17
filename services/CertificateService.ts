import { Question } from '../types/Question';
import { CertificateData } from './CertificateData';

export interface CertificateTemplate {
  id: string;
  name: string;
  template: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CertificateService {
  private static readonly CERTIFICATE_PREFIX = 'CERT_';
  
  // Generate certificate data
  static generateCertificateData(
    userId: string,
    userName: string,
    testResults: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      timeTaken: number;
      testType: 'pre_test' | 'post_test';
      submittedAt: string;
    },
    courseName?: string,
    institutionName?: string
  ): CertificateData {
    const certificateId = this.generateCertificateId();
    const percentage = Math.round((testResults.score / testResults.totalQuestions) * 100);
    const grade = this.getGrade(percentage);
    
    return {
      participantName: userName,
      participantEmail: 'participant@example.com', // This should be passed from the submission
      icNumber: undefined, // This should be passed from the submission
      jobPosition: undefined, // This should be passed from the submission
      testType: testResults.testType,
      score: testResults.score,
      totalQuestions: testResults.totalQuestions,
      grade: grade,
      percentage: percentage,
      issuedAt: testResults.submittedAt,
      certificateId: certificateId,
    };
  }

  // Generate unique certificate ID
  static generateCertificateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.CERTIFICATE_PREFIX}${timestamp}_${random}`.toUpperCase();
  }

  // Generate certificate HTML
  static generateCertificateHTML(certificateData: CertificateData): string {
    const completionDate = new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const grade = this.getGrade(certificateData.score);
    const gradeColor = this.getGradeColor(certificateData.score);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .certificate {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 60px;
            max-width: 800px;
            width: 100%;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .certificate::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
            z-index: 0;
        }
        
        .certificate-content {
            position: relative;
            z-index: 1;
        }
        
        .header {
            margin-bottom: 40px;
        }
        
        .institution-name {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .certificate-title {
            font-size: 36px;
            font-weight: 800;
            color: #2d3748;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .awarded-to {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 30px;
        }
        
        .recipient-name {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 20px;
            text-decoration: underline;
            text-decoration-color: #667eea;
            text-underline-offset: 8px;
        }
        
        .course-details {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #e2e8f0;
        }
        
        .course-name {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 20px;
        }
        
        .test-type {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .score-section {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .score-item {
            text-align: center;
        }
        
        .score-label {
            font-size: 14px;
            color: #718096;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .score-value {
            font-size: 24px;
            font-weight: 700;
            color: ${gradeColor};
        }
        
        .grade {
            font-size: 48px;
            font-weight: 800;
            color: ${gradeColor};
            margin: 20px 0;
        }
        
        .completion-date {
            font-size: 16px;
            color: #4a5568;
            margin-top: 30px;
        }
        
        .certificate-id {
            font-size: 12px;
            color: #a0aec0;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
        }
        
        .signature {
            text-align: center;
        }
        
        .signature-line {
            width: 150px;
            height: 2px;
            background: #2d3748;
            margin: 10px auto;
        }
        
        .signature-label {
            font-size: 14px;
            color: #4a5568;
            margin-top: 5px;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            font-weight: 800;
            color: rgba(102, 126, 234, 0.05);
            z-index: 0;
            pointer-events: none;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .certificate {
                box-shadow: none;
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="watermark">CERTIFICATE</div>
        
        <div class="certificate-content">
            <div class="header">
                <div class="institution-name">${certificateData.institutionName}</div>
                <div class="certificate-title">Certificate of Completion</div>
                <div class="awarded-to">This is to certify that</div>
            </div>
            
            <div class="recipient-name">${certificateData.participantName}</div>
            
            <div class="course-details">
                <div class="course-name">${certificateData.courseName}</div>
                <div class="test-type">${certificateData.testType === 'pre_test' ? 'Pre-Test' : 'Post-Test'}</div>
                
                <div class="score-section">
                    <div class="score-item">
                        <div class="score-label">Score</div>
                        <div class="score-value">${certificateData.score}%</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Correct</div>
                        <div class="score-value">${certificateData.correctAnswers}/${certificateData.totalQuestions}</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Time</div>
                        <div class="score-value">${Math.floor(certificateData.timeTaken / 60)}:${(certificateData.timeTaken % 60).toString().padStart(2, '0')}</div>
                    </div>
                </div>
                
                <div class="grade">Grade: ${grade}</div>
            </div>
            
            <div class="completion-date">
                Completed on ${completionDate}
            </div>
            
            <div class="certificate-id">
                Certificate ID: ${certificateData.certificateId}
            </div>
            
            <div class="signature-section">
                <div class="signature">
                    <div class="signature-line"></div>
                    <div class="signature-label">Instructor</div>
                </div>
                <div class="signature">
                    <div class="signature-line"></div>
                    <div class="signature-label">Director of Training</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Get grade based on score
  static getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  }

  // Get grade color
  static getGradeColor(score: number): string {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ffaa00';
    return '#ff6b6b';
  }

  // Validate certificate data
  static validateCertificateData(data: CertificateData): boolean {
    return !!(
      data.participantName &&
      data.participantEmail &&
      data.testType &&
      data.score >= 0 &&
      data.totalQuestions > 0 &&
      data.percentage >= 0 &&
      data.issuedAt &&
      data.certificateId
    );
  }

  // Generate certificate summary
  static generateCertificateSummary(certificateData: CertificateData): string {
    const grade = certificateData.grade;
    const completionDate = new Date(certificateData.issuedAt).toLocaleDateString();
    
    return `
Certificate of Completion
Basic Life Support Training Program

Student: ${certificateData.participantName}
Email: ${certificateData.participantEmail}
Test: ${certificateData.testType === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
Score: ${certificateData.score}/${certificateData.totalQuestions} (${certificateData.percentage}%)
Grade: ${grade}
Completed: ${completionDate}
Certificate ID: ${certificateData.certificateId}
    `.trim();
  }

  // Generate results PDF for analytics
  static async generateResultsPdf(submissions: any[], analytics: any): Promise<void> {
    try {
      const reportData = {
        title: 'BLS Test Results & Analytics Report',
        generatedAt: new Date().toISOString(),
        totalSubmissions: submissions.length,
        analytics: analytics,
        submissions: submissions.map(sub => ({
          id: sub.id,
          userName: sub.user_name,
          userEmail: sub.user_email,
          userType: sub.user_type,
          testType: sub.test_type,
          score: sub.correct_answers,
          totalQuestions: sub.total_questions,
          timeTaken: sub.time_taken,
          submittedAt: sub.submitted_at,
        })),
      };
      
      // Generate HTML report
      const html = this.generateResultsHTML(reportData);
      
      // Create and download the report
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `BLS_Results_Report_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Error generating results PDF:', error);
      throw error;
    }
  }

  // Generate HTML report for results
  private static generateResultsHTML(reportData: any): string {
    const preTestSubmissions = reportData.submissions.filter((sub: any) => sub.testType === 'pre_test');
    const postTestSubmissions = reportData.submissions.filter((sub: any) => sub.testType === 'post_test');
    
    const preTestStats = this.calculateTestStats(preTestSubmissions);
    const postTestStats = this.calculateTestStats(postTestSubmissions);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${reportData.title}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: #f8fafc;
            color: #1f2937;
        }
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
        }
        .stat-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
        }
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .submissions-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .submissions-table th,
        .submissions-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .submissions-table th {
            background: #f8fafc;
            font-weight: bold;
            color: #1e40af;
        }
        .test-type {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .pre-test {
            background: #dbeafe;
            color: #1e40af;
        }
        .post-test {
            background: #dcfce7;
            color: #16a34a;
        }
        .score {
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <div class="title">${reportData.title}</div>
            <div class="subtitle">Generated on ${new Date(reportData.generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">Pre-Test Results</div>
                <div class="stat-value">${preTestStats.averageScore}%</div>
                <div class="stat-label">Average Score (${preTestSubmissions.length} participants)</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Post-Test Results</div>
                <div class="stat-value">${postTestStats.averageScore}%</div>
                <div class="stat-label">Average Score (${postTestSubmissions.length} participants)</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Pre-Test Pass Rate</div>
                <div class="stat-value">${preTestStats.passRate}%</div>
                <div class="stat-label">${preTestStats.passed} passed, ${preTestStats.failed} failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Post-Test Pass Rate</div>
                <div class="stat-value">${postTestStats.passRate}%</div>
                <div class="stat-label">${postTestStats.passed} passed, ${postTestStats.failed} failed</div>
            </div>
        </div>
        
        <h3 style="color: #1e40af; margin: 30px 0 20px 0;">Detailed Results Comparison</h3>
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>Participant</th>
                    <th>Email</th>
                    <th colspan="4">Pre-Test</th>
                    <th colspan="4">Post-Test</th>
                    <th colspan="2">Improvement</th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Time</th>
                    <th>Pass/Fail</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Time</th>
                    <th>Pass/Fail</th>
                    <th>Score %</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>
                ${this.generateComparisonRows(reportData.submissions)}
            </tbody>
        </table>
        
        <div class="footer">
            <p>This report was generated automatically by the Basic Life Support Training System</p>
            <p>For questions or support, please contact your system administrator</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Calculate test statistics
  private static calculateTestStats(submissions: any[]): any {
    if (submissions.length === 0) {
      return { averageScore: 0, passRate: 0, passed: 0, failed: 0 };
    }
    
    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score / sub.totalQuestions) * 100, 0);
    const averageScore = Math.round(totalScore / submissions.length);
    const passed = submissions.filter(sub => (sub.score / sub.totalQuestions) * 100 >= 60).length;
    const failed = submissions.length - passed;
    const passRate = Math.round((passed / submissions.length) * 100);
    
    return { averageScore, passRate, passed, failed };
  }

  // Generate comparison rows for PDF report
  private static generateComparisonRows(submissions: any[]): string {
    // Group submissions by participant
    const participantMap = new Map();
    
    submissions.forEach(sub => {
      const key = sub.userEmail;
      if (!participantMap.has(key)) {
        participantMap.set(key, {
          name: sub.userName,
          email: sub.userEmail,
          preTest: null,
          postTest: null
        });
      }
      
      const participant = participantMap.get(key);
      if (sub.testType === 'pre_test') {
        participant.preTest = sub;
      } else if (sub.testType === 'post_test') {
        participant.postTest = sub;
      }
    });
    
    return Array.from(participantMap.values()).map(participant => {
      const preTest = participant.preTest;
      const postTest = participant.postTest;
      
      // Pre-test data
      const preScore = preTest ? `${preTest.score}/${preTest.totalQuestions} (${Math.round((preTest.score / preTest.totalQuestions) * 100)}%)` : 'N/A';
      const preGrade = preTest ? this.calculateGrade(Math.round((preTest.score / preTest.totalQuestions) * 100)) : 'N/A';
      const preTime = preTest ? `${Math.round(preTest.timeTaken / 60)} min` : 'N/A';
      const prePass = preTest ? (Math.round((preTest.score / preTest.totalQuestions) * 100) >= 60 ? 'Pass' : 'Fail') : 'N/A';
      
      // Post-test data
      const postScore = postTest ? `${postTest.score}/${postTest.totalQuestions} (${Math.round((postTest.score / postTest.totalQuestions) * 100)}%)` : 'N/A';
      const postGrade = postTest ? this.calculateGrade(Math.round((postTest.score / postTest.totalQuestions) * 100)) : 'N/A';
      const postTime = postTest ? `${Math.round(postTest.timeTaken / 60)} min` : 'N/A';
      const postPass = postTest ? (Math.round((postTest.score / postTest.totalQuestions) * 100) >= 60 ? 'Pass' : 'Fail') : 'N/A';
      
      // Improvement calculation
      const prePercentage = preTest ? Math.round((preTest.score / preTest.totalQuestions) * 100) : 0;
      const postPercentage = postTest ? Math.round((postTest.score / postTest.totalQuestions) * 100) : 0;
      const improvement = (preTest && postTest) ? (postPercentage - prePercentage) : '';
      const gradeImprovement = (preTest && postTest) ? this.calculateGradeImprovement(preGrade, postGrade) : '';
      
      return `
        <tr>
          <td>${participant.name}</td>
          <td>${participant.email}</td>
          <td>${preScore}</td>
          <td>${preGrade}</td>
          <td>${preTime}</td>
          <td>${prePass}</td>
          <td>${postScore}</td>
          <td>${postGrade}</td>
          <td>${postTime}</td>
          <td>${postPass}</td>
          <td>${improvement ? (improvement > 0 ? `+${improvement}%` : `${improvement}%`) : 'N/A'}</td>
          <td>${gradeImprovement || 'N/A'}</td>
        </tr>
      `;
    }).join('');
  }

  // Generate Excel export for analytics
  static async generateExcelExport(submissions: any[], analytics: any): Promise<void> {
    try {
      const csvData = this.generateCSVData(submissions, analytics);
      
      // Create and download the CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `BLS_Results_Data_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Error generating Excel export:', error);
      throw error;
    }
  }

  // Generate CSV data for Excel export
  private static generateCSVData(submissions: any[], analytics: any): string {
    const headers = [
      'Participant ID',
      'Name',
      'Email',
      'Pre-Test Score',
      'Pre-Test Total',
      'Pre-Test Percentage',
      'Pre-Test Grade',
      'Pre-Test Time (min)',
      'Pre-Test Pass/Fail',
      'Post-Test Score',
      'Post-Test Total',
      'Post-Test Percentage',
      'Post-Test Grade',
      'Post-Test Time (min)',
      'Post-Test Pass/Fail',
      'Improvement (%)',
      'Grade Improvement'
    ];
    
    // Group submissions by participant
    const participantMap = new Map();
    
    submissions.forEach(sub => {
      const key = sub.user_email; // Use email as unique identifier
      if (!participantMap.has(key)) {
        participantMap.set(key, {
          id: sub.id,
          name: sub.user_name,
          email: sub.user_email,
          preTest: null,
          postTest: null
        });
      }
      
      const participant = participantMap.get(key);
      if (sub.test_type === 'pre_test') {
        participant.preTest = sub;
      } else if (sub.test_type === 'post_test') {
        participant.postTest = sub;
      }
    });
    
    // Generate rows with combined data
    const rows = Array.from(participantMap.values()).map(participant => {
      const preTest = participant.preTest;
      const postTest = participant.postTest;
      
      // Pre-test data
      const preScore = preTest ? preTest.correct_answers : '';
      const preTotal = preTest ? preTest.total_questions : '';
      const prePercentage = preTest ? Math.round((preTest.correct_answers / preTest.total_questions) * 100) : '';
      const preGrade = preTest ? this.calculateGrade(prePercentage) : '';
      const preTime = preTest ? Math.round(preTest.time_taken / 60) : '';
      const prePass = preTest ? (prePercentage >= 60 ? 'Pass' : 'Fail') : '';
      
      // Post-test data
      const postScore = postTest ? postTest.correct_answers : '';
      const postTotal = postTest ? postTest.total_questions : '';
      const postPercentage = postTest ? Math.round((postTest.correct_answers / postTest.total_questions) * 100) : '';
      const postGrade = postTest ? this.calculateGrade(postPercentage) : '';
      const postTime = postTest ? Math.round(postTest.time_taken / 60) : '';
      const postPass = postTest ? (postPercentage >= 60 ? 'Pass' : 'Fail') : '';
      
      // Improvement calculation
      const improvement = (preTest && postTest) ? (postPercentage - prePercentage) : '';
      const gradeImprovement = (preTest && postTest) ? this.calculateGradeImprovement(preGrade, postGrade) : '';
      
      return [
        participant.id,
        `"${participant.name}"`,
        `"${participant.email}"`,
        preScore,
        preTotal,
        prePercentage,
        preGrade,
        preTime,
        prePass,
        postScore,
        postTotal,
        postPercentage,
        postGrade,
        postTime,
        postPass,
        improvement,
        gradeImprovement
      ].join(',');
    });
    
    // Add summary statistics
    const preTestSubmissions = submissions.filter(sub => sub.test_type === 'pre_test');
    const postTestSubmissions = submissions.filter(sub => sub.test_type === 'post_test');
    
    const preTestStats = this.calculateTestStats(preTestSubmissions);
    const postTestStats = this.calculateTestStats(postTestSubmissions);
    
    const summaryRows = [
      [],
      ['SUMMARY STATISTICS'],
      ['Test Type', 'Total Participants', 'Average Score (%)', 'Pass Rate (%)', 'Passed', 'Failed'],
      ['Pre-Test', preTestSubmissions.length, preTestStats.averageScore, preTestStats.passRate, preTestStats.passed, preTestStats.failed],
      ['Post-Test', postTestSubmissions.length, postTestStats.averageScore, postTestStats.passRate, postTestStats.passed, postTestStats.failed],
      ['Overall', submissions.length, Math.round((preTestStats.averageScore + postTestStats.averageScore) / 2), Math.round((preTestStats.passRate + postTestStats.passRate) / 2), preTestStats.passed + postTestStats.passed, preTestStats.failed + postTestStats.failed]
    ];
    
    return [headers.join(','), ...rows, ...summaryRows.map(row => row.join(','))].join('\n');
  }

  // Calculate grade improvement
  private static calculateGradeImprovement(preGrade: string, postGrade: string): string {
    if (!preGrade || !postGrade) return '';
    
    const gradeOrder = ['F', 'E', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
    const preIndex = gradeOrder.indexOf(preGrade);
    const postIndex = gradeOrder.indexOf(postGrade);
    
    if (preIndex === -1 || postIndex === -1) return '';
    
    const improvement = postIndex - preIndex;
    if (improvement > 0) return `+${improvement} grades`;
    if (improvement < 0) return `${improvement} grades`;
    return 'No change';
  }

  // Calculate grade based on percentage
  private static calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    if (percentage >= 35) return 'D-';
    if (percentage >= 30) return 'E';
    return 'F';
  }

  // Generate certificate PDF using PDFCertificateService
  static async generateCertificatePdf(certificateData: CertificateData): Promise<void> {
    try {
      console.log('🔍 Generating certificate PDF for:', certificateData.participantName);
      
      // Use the PDFCertificateService to generate and download the certificate
      const { PDFCertificateService } = await import('./PDFCertificateService');
      PDFCertificateService.downloadCertificate(certificateData);
      
      console.log('✅ Certificate PDF generated successfully');
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      throw error;
    }
  }
}
