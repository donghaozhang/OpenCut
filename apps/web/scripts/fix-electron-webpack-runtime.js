#!/usr/bin/env node

/**
 * Fix Webpack Runtime for Electron
 * 
 * This script fixes the webpack runtime in the built files to use relative paths
 * instead of absolute paths for chunk loading in Electron.
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../out');

function fixWebpackRuntime(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix webpack publicPath to use relative paths
    // Look for __webpack_require__.p = "/" or similar patterns
    content = content.replace(
      /(__webpack_require__\.p\s*=\s*["'])(\/["'])/g,
      '$1./$2'
    );
    
    // Fix specific patterns that cause absolute path issues
    // Pattern: r.p="/" -> r.p="./"
    content = content.replace(
      /(\w+\.p\s*=\s*["'])(\/)["']/g,
      '$1./$2'
    );
    
    // Fix URL construction in webpack chunks
    // Pattern that constructs URLs like "/C:/_next/..."
    content = content.replace(
      /return\s+["']\/["']\s*\+/g,
      'return "./" +'
    );
    
    // Fix any hardcoded absolute paths in chunk loading
    content = content.replace(
      /["'](\/_next\/)/g,
      '"./$1'
    );
    
    // Fix chunk URL construction that results in file:///C:/_next paths
    // This pattern appears in webpack's chunk loading mechanism
    content = content.replace(
      /(\w+)\s*\+\s*["'](\/_next[^"']+)["']/g,
      function(match, varName, path) {
        // If the variable looks like it might be empty or "/", replace with relative path
        return `((${varName} === "/" || ${varName} === "") ? ".${path}" : ${varName} + "${path}")`;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed webpack runtime in ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, callback) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function main() {
  console.log('🔧 Fixing webpack runtime for Electron...');
  
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`❌ Output directory not found: ${OUT_DIR}`);
    console.error('   Make sure to run "bun run build:electron" first');
    process.exit(1);
  }
  
  let totalFixed = 0;
  
  // Fix webpack runtime in JS files
  walkDirectory(OUT_DIR, (filePath) => {
    if (filePath.endsWith('.js')) {
      // Focus on webpack and main files
      const basename = path.basename(filePath);
      if (basename.includes('webpack') || 
          basename.includes('main') || 
          basename.includes('framework') ||
          basename.includes('_app')) {
        if (fixWebpackRuntime(filePath)) {
          totalFixed++;
        }
      }
    }
  });
  
  // Also check the HTML files for inline scripts
  walkDirectory(OUT_DIR, (filePath) => {
    if (filePath.endsWith('.html')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Fix any inline script tags that set webpack public path
        content = content.replace(
          /(__webpack_public_path__\s*=\s*["'])(\/["'])/g,
          '$1./$2'
        );
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          console.log(`✅ Fixed inline scripts in ${path.basename(filePath)}`);
          totalFixed++;
        }
      } catch (error) {
        console.error(`❌ Error fixing HTML ${filePath}:`, error.message);
      }
    }
  });
  
  console.log(`✅ Complete! Fixed ${totalFixed} files`);
}

if (require.main === module) {
  main();
}

module.exports = { fixWebpackRuntime };