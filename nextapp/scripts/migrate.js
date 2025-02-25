#!/usr/bin/env node

/**
 * Migration script to help with the transition from the old codebase to the new one
 * 
 * This script will:
 * 1. Copy static assets from the old structure to the new structure
 * 2. Generate a report of files that need to be manually migrated
 * 3. Provide a summary of the migration progress
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OLD_ROOT = '../ui';
const NEW_ROOT = '.';
const STATIC_DIRS = ['public', 'assets', 'images'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock'
];

// Ensure the script is run from the nextapp directory
if (!fs.existsSync('package.json')) {
  console.error('Error: This script must be run from the nextapp directory');
  process.exit(1);
}

// Create directories if they don't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Copy a file from source to destination
function copyFile(source, destination) {
  ensureDirectoryExists(path.dirname(destination));
  fs.copyFileSync(source, destination);
  console.log(`Copied: ${source} -> ${destination}`);
}

// Copy a directory recursively
function copyDirectory(source, destination) {
  ensureDirectoryExists(destination);
  
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    // Skip ignored patterns
    if (IGNORE_PATTERNS.some(pattern => sourcePath.includes(pattern))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      copyFile(sourcePath, destPath);
    }
  }
}

// Generate a report of files that need manual migration
function generateMigrationReport() {
  const report = {
    components: [],
    stores: [],
    views: [],
    utils: [],
    other: []
  };
  
  // Helper function to scan a directory and categorize files
  function scanDirectory(dir, baseDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      // Skip ignored patterns
      if (IGNORE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, baseDir);
      } else {
        // Categorize the file
        if (fullPath.includes('/components/')) {
          report.components.push(relativePath);
        } else if (fullPath.includes('/stores/')) {
          report.stores.push(relativePath);
        } else if (fullPath.includes('/views/')) {
          report.views.push(relativePath);
        } else if (fullPath.includes('/utils/') || fullPath.includes('/helpers/')) {
          report.utils.push(relativePath);
        } else {
          report.other.push(relativePath);
        }
      }
    }
  }
  
  // Scan the old codebase
  if (fs.existsSync(OLD_ROOT)) {
    scanDirectory(OLD_ROOT, OLD_ROOT);
  }
  
  // Write the report to a file
  const reportContent = `# Migration Report
Generated on ${new Date().toISOString()}

## Components (${report.components.length})
${report.components.map(file => `- ${file}`).join('\n')}

## Stores (${report.stores.length})
${report.stores.map(file => `- ${file}`).join('\n')}

## Views (${report.views.length})
${report.views.map(file => `- ${file}`).join('\n')}

## Utils (${report.utils.length})
${report.utils.map(file => `- ${file}`).join('\n')}

## Other (${report.other.length})
${report.other.map(file => `- ${file}`).join('\n')}
`;

  fs.writeFileSync('migration-report.md', reportContent);
  console.log('Generated migration report: migration-report.md');
}

// Main function
function main() {
  console.log('Starting migration process...');
  
  // Check if the old codebase exists
  if (!fs.existsSync(OLD_ROOT)) {
    console.warn(`Warning: Old codebase directory not found at ${OLD_ROOT}`);
    console.log('Skipping file copying steps.');
  } else {
    // Copy static directories
    for (const dir of STATIC_DIRS) {
      const sourceDir = path.join(OLD_ROOT, dir);
      const destDir = path.join(NEW_ROOT, 'public', dir);
      
      if (fs.existsSync(sourceDir)) {
        console.log(`Copying ${dir} directory...`);
        copyDirectory(sourceDir, destDir);
      }
    }
    
    // Generate migration report
    generateMigrationReport();
  }
  
  console.log('\nMigration process completed!');
  console.log('\nNext steps:');
  console.log('1. Review the migration report');
  console.log('2. Manually migrate components, stores, and views');
  console.log('3. Update imports and dependencies');
  console.log('4. Test the new application');
}

// Run the main function
main(); 