const fs = require('fs');
const path = require('path');

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log statements (including multi-line ones)
    const consoleLogRegex = /console\.log\([^;]*\);?\s*/g;
    const originalContent = content;
    content = content.replace(consoleLogRegex, '');
    
    // Also remove console.log statements that might be on their own lines
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('console.log(') && 
             !trimmed.match(/^\s*console\.log\(/);
    });
    
    content = filteredLines.join('\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned console.log statements from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively process directory
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let cleanedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other directories we don't want to process
      if (item !== 'node_modules' && item !== '.git') {
        cleanedCount += processDirectory(fullPath);
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
      if (removeConsoleLogs(fullPath)) {
        cleanedCount++;
      }
    }
  }
  
  return cleanedCount;
}

// Main execution
const screensDir = path.join(__dirname, '..', 'screens');
const servicesDir = path.join(__dirname, '..', 'services');
const componentsDir = path.join(__dirname, '..', 'components');

console.log('Starting console.log cleanup...');

let totalCleaned = 0;
totalCleaned += processDirectory(screensDir);
totalCleaned += processDirectory(servicesDir);
totalCleaned += processDirectory(componentsDir);

console.log(`Cleanup complete! Cleaned ${totalCleaned} files.`);
