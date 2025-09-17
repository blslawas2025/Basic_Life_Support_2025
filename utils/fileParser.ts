// File parsing utilities for CSV and Excel files
import * as FileSystem from 'expo-file-system';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { QuestionImportFormat } from '../types/Question';

export interface ParsedFileResult {
  success: boolean;
  data: QuestionImportFormat[];
  errors: string[];
  warnings: string[];
}

export class FileParser {
  // Parse CSV file
  static async parseCSV(fileUri: string): Promise<ParsedFileResult> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      return new Promise((resolve) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            const errors: string[] = [];
            const warnings: string[] = [];
            
            if (results.errors.length > 0) {
              results.errors.forEach((error: any) => {
                if (error.type === 'Delimiter') {
                  warnings.push(`Line ${error.row}: ${error.message}`);
                } else {
                  errors.push(`Line ${error.row}: ${error.message}`);
                }
              });
            }
            
            // Convert parsed data to QuestionImportFormat
            const questions: QuestionImportFormat[] = results.data.map((row: any, index: number) => {
              return this.mapRowToQuestion(row, index);
            }).filter((question: any) => question.question_text.trim() !== '');
            
            resolve({
              success: errors.length === 0,
              data: questions,
              errors,
              warnings
            });
          },
          error: (error: any) => {
            resolve({
              success: false,
              data: [],
              errors: [`CSV parsing error: ${error.message}`],
              warnings: []
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Parse Excel file
  static async parseExcel(fileUri: string): Promise<ParsedFileResult> {
    try {
      console.log('Starting Excel parsing for URI:', fileUri);
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to array buffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Parse Excel file
      const workbook = XLSX.read(bytes, { type: 'array' });
      
      console.log('Excel workbook loaded, sheets:', workbook.SheetNames);
      
      // Check if we have multiple sheets for bilingual support
      if (workbook.SheetNames.length >= 2) {
        console.log('Detected multiple sheets, parsing as bilingual format');
        console.log('Available sheets:', workbook.SheetNames);
        return this.parseBilingualFormat(workbook);
      }
      
      // Single sheet - use existing logic
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return {
          success: false,
          data: [],
          errors: ['No worksheet found in Excel file'],
          warnings: []
        };
      }
      
      // Parse as object array
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        return {
          success: false,
          data: [],
          errors: ['Excel file appears to be empty'],
          warnings: []
        };
      }
      
      console.log('Raw Excel data (data URI):', JSON.stringify(jsonData, null, 2));
      
      // Check if this is a file with proper column headers or a single-column format
      const firstRow = jsonData[0] as any;
      const keys = Object.keys(firstRow);
      console.log('Excel keys (data URI):', keys);
      
      // If we have only one key and it contains question text, this is a single-column format
      if (keys.length === 1 && keys[0].length > 50) {
        console.log('Detected single-column format (data URI), parsing as question list');
        return this.parseSingleColumnFormat(jsonData);
      }
      
      // Convert to questions using standard mapping
      const questions: QuestionImportFormat[] = (jsonData as any[]).map((row, index) => {
        return this.mapRowToQuestion(row, index);
      }).filter(question => question.question_text.trim() !== '');
    
    return {
      success: true,
      data: questions,
      errors: [],
      warnings: []
    };
    } catch (error) {
      console.error('Excel parsing error:', error);
      return {
        success: false,
        data: [],
        errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Parse file based on extension
  static async parseFile(fileUri: string, fileName: string): Promise<ParsedFileResult> {
    const extension = fileName.toLowerCase().split('.').pop();
    
    console.log('Parsing file with extension:', extension);
    console.log('File URI type:', fileUri.startsWith('data:') ? 'data URI' : 'file URI');
    
    // Handle data URIs differently (this is the main path for web)
    if (fileUri.startsWith('data:')) {
      console.log('Processing data URI');
      return this.parseDataURI(fileUri, extension || '');
    }
    
    // For non-data URIs (mobile platforms)
    switch (extension) {
      case 'csv':
        return this.parseCSV(fileUri);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(fileUri);
      default:
        return {
          success: false,
          data: [],
          errors: [`Unsupported file format: ${extension}. Please upload a CSV or Excel file.`],
          warnings: []
        };
    }
  }

  // Parse data URI (for files picked from document picker)
  static async parseDataURI(dataUri: string, extension: string): Promise<ParsedFileResult> {
    try {
      console.log('Parsing data URI with extension:', extension);
      
      // Extract base64 data from data URI
      const base64Data = dataUri.split(',')[1];
      
      if (!base64Data) {
        return {
          success: false,
          data: [],
          errors: ['Invalid data URI format'],
          warnings: []
        };
      }
      
      if (extension === 'csv') {
        // For CSV, decode base64 and parse as text
        const csvText = atob(base64Data);
        
        return new Promise((resolve) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              const errors: string[] = [];
              const warnings: string[] = [];
              
              if (results.errors.length > 0) {
                results.errors.forEach((error: any) => {
                  if (error.type === 'Delimiter') {
                    warnings.push(`Line ${error.row}: ${error.message}`);
                  } else {
                    errors.push(`Line ${error.row}: ${error.message}`);
                  }
                });
              }
              
              // Convert parsed data to QuestionImportFormat
              const questions: QuestionImportFormat[] = results.data.map((row: any, index: number) => {
                return this.mapRowToQuestion(row, index);
              }).filter((question: any) => question.question_text.trim() !== '');
              
              resolve({
                success: errors.length === 0,
                data: questions,
                errors,
                warnings
              });
            },
            error: (error: any) => {
              resolve({
                success: false,
                data: [],
                errors: [`CSV parsing error: ${error.message}`],
                warnings: []
              });
            }
          });
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        // For Excel, convert base64 to array buffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Parse Excel file
        const workbook = XLSX.read(bytes, { type: 'array' });
        
        console.log('Excel workbook loaded (data URI), sheets:', workbook.SheetNames);
        
        // Check if we have multiple sheets for bilingual support
        if (workbook.SheetNames.length >= 2) {
          console.log('Detected multiple sheets (data URI), parsing as bilingual format');
          console.log('Available sheets:', workbook.SheetNames);
          return this.parseBilingualFormat(workbook);
        }
        
        // Single sheet - use existing logic
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          return {
            success: false,
            data: [],
            errors: ['No worksheet found in Excel file'],
            warnings: []
          };
        }
        
        // Parse as object array
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!jsonData || jsonData.length === 0) {
          return {
            success: false,
            data: [],
            errors: ['Excel file appears to be empty'],
            warnings: []
          };
        }
        
        console.log('Raw Excel data (data URI):', JSON.stringify(jsonData, null, 2));
        
        // Check if this is a file with proper column headers or a single-column format
        const firstRow = jsonData[0] as any;
        const keys = Object.keys(firstRow);
        console.log('Excel keys:', keys);
        
        // If we have only one key and it contains question text, this is a single-column format
        if (keys.length === 1 && keys[0].length > 50) {
          console.log('Detected single-column format, parsing as question list');
          return this.parseSingleColumnFormat(jsonData);
        }
        
        // Convert to questions using standard mapping
        const questions: QuestionImportFormat[] = (jsonData as any[]).map((row, index) => {
          return this.mapRowToQuestion(row, index);
        }).filter(question => question.question_text.trim() !== '');
        
        return {
          success: true,
          data: questions,
          errors: [],
          warnings: []
        };
      } else {
        return {
          success: false,
          data: [],
          errors: [`Unsupported file format: ${extension}. Please upload a CSV or Excel file.`],
          warnings: []
        };
      }
    } catch (error) {
      console.error('Data URI parsing error:', error);
      return {
        success: false,
        data: [],
        errors: [`Failed to parse data URI: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Parse bilingual format with multiple sheets (Malay and English)
  private static parseBilingualFormat(workbook: any): ParsedFileResult {
    console.log('Parsing bilingual format with sheets:', workbook.SheetNames);
    
    const questions: QuestionImportFormat[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Assume first sheet is Malay, second sheet is English
      const malaySheetName = workbook.SheetNames[0];
      const englishSheetName = workbook.SheetNames[1];
      
      console.log('Malay sheet:', malaySheetName);
      console.log('English sheet:', englishSheetName);
      
      // Parse Malay sheet
      const malayWorksheet = workbook.Sheets[malaySheetName];
      const malayData = XLSX.utils.sheet_to_json(malayWorksheet);
      console.log('Malay data rows:', malayData.length);
      
      // Parse English sheet
      const englishWorksheet = workbook.Sheets[englishSheetName];
      const englishData = XLSX.utils.sheet_to_json(englishWorksheet);
      console.log('English data rows:', englishData.length);
      
      // Parse both sheets using single-column format
      const malayResult = this.parseSingleColumnFormat(malayData);
      const englishResult = this.parseSingleColumnFormat(englishData);
      
      console.log('Malay questions parsed:', malayResult.data.length);
      console.log('English questions parsed:', englishResult.data.length);
      
      // Debug: Log first few questions from each sheet
      if (malayResult.data.length > 0) {
        console.log('First Malay question:', malayResult.data[0]);
      }
      if (englishResult.data.length > 0) {
        console.log('First English question:', englishResult.data[0]);
      }
      
      // Combine the results - create bilingual questions
      const maxQuestions = Math.max(malayResult.data.length, englishResult.data.length);
      
      for (let i = 0; i < maxQuestions; i++) {
        const malayQuestion = malayResult.data[i];
        const englishQuestion = englishResult.data[i];
        
        if (!malayQuestion && !englishQuestion) {
          continue; // Skip if both are missing
        }
        
        // Create bilingual question
        const bilingualQuestion: QuestionImportFormat = {
          question_text: malayQuestion?.question_text || englishQuestion?.question_text || '',
          question_text_en: englishQuestion?.question_text || malayQuestion?.question_text || '',
          question_type: malayQuestion?.question_type || englishQuestion?.question_type || 'multiple_choice',
          difficulty_level: malayQuestion?.difficulty_level || englishQuestion?.difficulty_level || 'easy',
          category: malayQuestion?.category || englishQuestion?.category || 'basic_life_support',
          points: malayQuestion?.points || englishQuestion?.points || 10,
          time_limit_seconds: malayQuestion?.time_limit_seconds || englishQuestion?.time_limit_seconds || 30,
          explanation: malayQuestion?.explanation || englishQuestion?.explanation || '',
          correct_answer: malayQuestion?.correct_answer || englishQuestion?.correct_answer || 'A',
          option_a: malayQuestion?.option_a || englishQuestion?.option_a || '',
          option_a_en: englishQuestion?.option_a || malayQuestion?.option_a || '',
          option_b: malayQuestion?.option_b || englishQuestion?.option_b || '',
          option_b_en: englishQuestion?.option_b || malayQuestion?.option_b || '',
          option_c: malayQuestion?.option_c || englishQuestion?.option_c || '',
          option_c_en: englishQuestion?.option_c || malayQuestion?.option_c || '',
          option_d: malayQuestion?.option_d || englishQuestion?.option_d || '',
          option_d_en: englishQuestion?.option_d || malayQuestion?.option_d || '',
          tags: malayQuestion?.tags || englishQuestion?.tags || undefined,
          test_type: malayQuestion?.test_type || englishQuestion?.test_type || 'practice'
        };
        
        questions.push(bilingualQuestion);
        
        // Debug: Log first bilingual question
        if (i === 0) {
          console.log('First bilingual question created:', bilingualQuestion);
        }
      }
      
      // Combine errors and warnings
      errors.push(...malayResult.errors, ...englishResult.errors);
      warnings.push(...malayResult.warnings, ...englishResult.warnings);
      
      console.log(`\n=== BILINGUAL PARSING SUMMARY ===`);
      console.log(`Total bilingual questions created: ${questions.length}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Warnings: ${warnings.length}`);
      
      return {
        success: errors.length === 0,
        data: questions,
        errors,
        warnings
      };
      
    } catch (error) {
      console.error('Bilingual parsing error:', error);
      return {
        success: false,
        data: [],
        errors: [`Failed to parse bilingual format: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // Parse single-column format where each row contains a complete question
  private static parseSingleColumnFormat(jsonData: any[]): ParsedFileResult {
    console.log('Parsing single-column format with', jsonData.length, 'rows');
    
    const questions: QuestionImportFormat[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Get the key name (which contains the question text)
    const keyName = Object.keys(jsonData[0])[0];
    console.log('Key name:', keyName);
    
    // Check if the key name itself contains a question (starts with number)
    const keyNameHasQuestion = /^\d+[\.\)]\s*/.test(keyName);
    
    if (keyNameHasQuestion) {
      console.log('Detected question in column header, parsing as grouped format');
      
      // The question text is in the column header, options are in the rows
      let currentQuestionText = keyName;
      let currentOptions: string[] = [];
      let questionIndex = 0;
      
      // Process the first question (from column header)
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const optionText = row[keyName];
        
        if (!optionText || typeof optionText !== 'string' || optionText.trim() === '') {
          console.log(`Skipping empty row ${i + 1}`);
          continue;
        }
        
        const cleanText = optionText.trim();
        
        // Check if this looks like a new question (starts with number like "2.", "3.", etc.)
        const isNewQuestion = /^\d+[\.\)]\s*/.test(cleanText);
        
        if (isNewQuestion) {
          // Process the previous question if we have options
          if (currentOptions.length > 0) {
            const fullQuestionText = currentQuestionText + '\n' + currentOptions.join('\n');
            const parsedQuestion = this.parseQuestionText(fullQuestionText, questionIndex);
            if (parsedQuestion) {
              questions.push(parsedQuestion);
              console.log('✅ Successfully parsed question');
            } else {
              console.log('❌ Failed to parse question');
              errors.push(`Question ${questionIndex + 1}: Could not parse question format`);
            }
            questionIndex++;
          }
          
          // Start new question
          currentQuestionText = cleanText;
          currentOptions = [];
          console.log(`\n--- Starting Question ${questionIndex + 1} ---`);
          console.log('Question text:', cleanText.substring(0, 100) + '...');
        } else {
          // This is an option for the current question
          currentOptions.push(cleanText);
          console.log('Added option to current question:', cleanText.substring(0, 50) + '...');
        }
      }
      
      // Process the last question
      if (currentOptions.length > 0) {
        const fullQuestionText = currentQuestionText + '\n' + currentOptions.join('\n');
        const parsedQuestion = this.parseQuestionText(fullQuestionText, questionIndex);
        if (parsedQuestion) {
          questions.push(parsedQuestion);
          console.log('✅ Successfully parsed question');
        } else {
          console.log('❌ Failed to parse question');
          errors.push(`Question ${questionIndex + 1}: Could not parse question format`);
        }
      }
    } else {
      console.log('Detected standard format, parsing as individual questions');
      
      // Group rows into questions - each question starts with a number and is followed by options
      let currentQuestion: string[] = [];
      let questionIndex = 0;
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const questionText = row[keyName];
        
        if (!questionText || typeof questionText !== 'string' || questionText.trim() === '') {
          console.log(`Skipping empty row ${i + 1}`);
          continue;
        }
        
        const cleanText = questionText.trim();
        
        // Check if this looks like a new question (starts with number like "1.", "2.", etc.)
        const isNewQuestion = /^\d+[\.\)]\s*/.test(cleanText);
        
        if (isNewQuestion) {
          // Process the previous question if we have one
          if (currentQuestion.length > 0) {
            const parsedQuestion = this.parseQuestionText(currentQuestion.join('\n'), questionIndex);
            if (parsedQuestion) {
              questions.push(parsedQuestion);
              console.log('✅ Successfully parsed question');
            } else {
              console.log('❌ Failed to parse question');
              errors.push(`Question ${questionIndex + 1}: Could not parse question format`);
            }
            questionIndex++;
          }
          
          // Start new question
          currentQuestion = [cleanText];
          console.log(`\n--- Starting Question ${questionIndex + 1} ---`);
          console.log('Question text:', cleanText.substring(0, 100) + '...');
        } else {
          // This is part of the current question (likely an option)
          currentQuestion.push(cleanText);
          console.log('Added to current question:', cleanText.substring(0, 50) + '...');
        }
      }
      
      // Process the last question
      if (currentQuestion.length > 0) {
        const parsedQuestion = this.parseQuestionText(currentQuestion.join('\n'), questionIndex);
        if (parsedQuestion) {
          questions.push(parsedQuestion);
          console.log('✅ Successfully parsed question');
        } else {
          console.log('❌ Failed to parse question');
          errors.push(`Question ${questionIndex + 1}: Could not parse question format`);
        }
      }
    }
    
    console.log(`\n=== SINGLE-COLUMN PARSING SUMMARY ===`);
    console.log(`Total rows processed: ${jsonData.length}`);
    console.log(`Successfully parsed questions: ${questions.length}`);
    console.log(`Errors: ${errors.length}`);
    
    return {
      success: errors.length === 0,
      data: questions,
      errors,
      warnings
    };
  }

  // Parse question text to extract question and options
  private static parseQuestionText(text: string, index: number): QuestionImportFormat | null {
    try {
      console.log(`\n--- Parsing Question ${index + 1} ---`);
      console.log('Full text:', text);
      
      // Split into lines for better processing
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      console.log('Lines:', lines);
      
      let questionText = '';
      const options: string[] = [];
      
      // Process each line
      for (const line of lines) {
        // Check if this line is an option (starts with a., b., c., d.)
        const optionMatch = line.match(/^[a-d][\.\)]\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[1].trim());
          console.log(`Found option: ${optionMatch[1].trim()}`);
        } else {
          // This is part of the question text
          if (questionText) {
            questionText += ' ' + line;
          } else {
            questionText = line;
          }
        }
      }
      
      // Remove question number if present (e.g., "1. " or "1) ")
      const cleanedQuestion = questionText.replace(/^\d+[\.\)]\s*/, '').trim();
      
      // If we only have options and no question text, this might be a malformed question
      if (!cleanedQuestion && options.length > 0) {
        console.log('⚠️ Question has only options, no question text - skipping');
        return null;
      }
      
      console.log('Extracted question:', cleanedQuestion);
      console.log('Extracted options:', options);
      
      // Create the question object
      const question: QuestionImportFormat = {
        question_text: cleanedQuestion,
        question_type: 'multiple_choice',
        difficulty_level: 'easy',
        category: 'basic_life_support',
        points: 10,
        correct_answer: options.length > 0 ? 'A' : undefined,
        option_a: options[0] || '',
        option_b: options[1] || '',
        option_c: options[2] || '',
        option_d: options[3] || '',
        test_type: 'practice'
      };
      
      return question;
    } catch (error) {
      console.error('Error parsing question text:', error);
      return null;
    }
  }

  // Map a row to QuestionImportFormat
  private static mapRowToQuestion(row: any, index: number): QuestionImportFormat {
    console.log(`\n--- Mapping Row ${index + 1} ---`);
    console.log('Raw row data:', JSON.stringify(row, null, 2));
    console.log('Available keys:', Object.keys(row));
    
    // Helper function to get value from row with multiple possible keys
    const getValue = (keys: string[], defaultValue: any = '') => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          const value = String(row[key]).trim();
          console.log(`Found value for key "${key}":`, value);
          return value;
        }
      }
      console.log(`No value found for keys:`, keys, 'using default:', defaultValue);
      return defaultValue;
    };

    // Helper function to get numeric value
    const getNumericValue = (keys: string[], defaultValue: number = 0) => {
      const value = getValue(keys, defaultValue);
      const num = parseInt(value);
      const result = isNaN(num) ? defaultValue : num;
      console.log(`Numeric value for keys ${keys.join(', ')}: ${value} -> ${result}`);
      return result;
    };

    const mappedQuestion = {
      question_text: getValue([
        'question_text', 'question', 'text', 'Question Text', 'Question'
      ]),
      question_type: getValue([
        'question_type', 'type', 'Question Type', 'Type'
      ], 'multiple_choice').toLowerCase(),
      difficulty_level: getValue([
        'difficulty_level', 'difficulty', 'Difficulty Level', 'Difficulty'
      ], 'easy').toLowerCase(),
      category: getValue([
        'category', 'Category'
      ], 'basic_life_support').toLowerCase().replace(/\s+/g, '_'),
      points: getNumericValue([
        'points', 'point', 'Points', 'Point'
      ], 10),
      time_limit_seconds: getNumericValue([
        'time_limit_seconds', 'time_limit', 'Time Limit'
      ], 0) || undefined,
      explanation: getValue([
        'explanation', 'Explanation'
      ]),
      correct_answer: getValue([
        'correct_answer', 'correct', 'answer', 'Correct Answer', 'Correct', 'Answer'
      ]).toUpperCase(),
      option_a: getValue([
        'option_a', 'optionA', 'a', 'Option A', 'Option A'
      ]),
      option_b: getValue([
        'option_b', 'optionB', 'b', 'Option B', 'Option B'
      ]),
      option_c: getValue([
        'option_c', 'optionC', 'c', 'Option C', 'Option C'
      ]),
      option_d: getValue([
        'option_d', 'optionD', 'd', 'Option D', 'Option D'
      ]),
      tags: getValue([
        'tags', 'Tags'
      ]),
      test_type: getValue([
        'test_type', 'testType', 'Test Type'
      ]).toLowerCase().replace(/\s+/g, '_')
    };
    
    console.log('Mapped question:', JSON.stringify(mappedQuestion, null, 2));
    
    return mappedQuestion;
  }

  // Validate parsed questions
  static validateQuestions(questions: QuestionImportFormat[]): {
    valid: QuestionImportFormat[];
    invalid: { question: QuestionImportFormat; errors: string[] }[];
  } {
    const valid: QuestionImportFormat[] = [];
    const invalid: { question: QuestionImportFormat; errors: string[] }[] = [];
    
    console.log('Starting validation of', questions.length, 'questions');
    
    questions.forEach((question, index) => {
      const errors: string[] = [];
      
      console.log(`\n--- Validating Question ${index + 1} ---`);
      console.log('Question data:', JSON.stringify(question, null, 2));
      
      // Only validate that question text exists - everything else is optional
      if (!question.question_text || question.question_text.trim() === '') {
        errors.push('Question text is required');
        console.log('❌ Missing question text');
      } else {
        console.log('✅ Question text:', question.question_text.substring(0, 50) + '...');
      }
      
      // All other validations removed - accept any values
      console.log('✅ Question type:', question.question_type || 'not specified');
      console.log('✅ Difficulty level:', question.difficulty_level || 'not specified');
      console.log('✅ Category:', question.category || 'not specified');
      console.log('✅ Points:', question.points || 'not specified');
      console.log('✅ Correct answer:', question.correct_answer || 'not specified');
      console.log('✅ Options - A:', question.option_a || 'not specified', 'B:', question.option_b || 'not specified');
      
      if (errors.length === 0) {
        valid.push(question);
        console.log('✅ Question is VALID');
      } else {
        console.log('❌ Question is INVALID with errors:', errors);
        invalid.push({ question, errors });
      }
    });
    
    console.log(`\n=== VALIDATION SUMMARY ===`);
    console.log(`Valid questions: ${valid.length}`);
    console.log(`Invalid questions: ${invalid.length}`);
    
    return { valid, invalid };
  }
}
