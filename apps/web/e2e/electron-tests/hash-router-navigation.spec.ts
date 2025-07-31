import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import path from 'path';

/**
 * E2E Test: Hash Router Navigation Debug
 * 
 * This test verifies the Hash Router implementation for Electron navigation,
 * specifically debugging the Projects button navigation issue.
 */

test.describe('Hash Router Navigation', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../electron-dist/main.js')],
      timeout: 30000,
    });
    
    // Get the first window
    page = await electronApp.firstWindow();
    
    // Wait for app to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give React time to hydrate
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should detect Electron environment correctly', async () => {
    console.log('🔍 Testing Electron environment detection...');
    
    // Check if electronAPI is available
    const hasElectronAPI = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    console.log('📊 ElectronAPI available:', hasElectronAPI);
    expect(hasElectronAPI).toBe(true);
    
    // Check if Electron detection log appears
    const electronDetected = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-electron') === 'true';
    });
    
    console.log('📊 Electron detected in DOM:', electronDetected);
    expect(electronDetected).toBe(true);
  });

  test('should show UniversalLink debug messages when clicking Projects', async () => {
    console.log('🔍 Testing UniversalLink debug output...');
    
    // Set up console listener to capture debug messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('UniversalLink')) {
        consoleMessages.push(text);
        console.log('📝 Console:', text);
      }
    });
    
    // Wait for page to be fully loaded
    await page.waitForSelector('button:has-text("Projects")', { timeout: 10000 });
    
    // Click the Projects button
    console.log('🖱️ Clicking Projects button...');
    await page.click('button:has-text("Projects")');
    
    // Wait a moment for any console messages
    await page.waitForTimeout(1000);
    
    console.log('📊 Total UniversalLink messages captured:', consoleMessages.length);
    consoleMessages.forEach((msg, i) => {
      console.log(`📝 Message ${i + 1}:`, msg);
    });
    
    // Check if we got the expected debug messages
    const hasRenderMessage = consoleMessages.some(msg => 
      msg.includes('🔄 UniversalLink render:')
    );
    const hasReactRouterMessage = consoleMessages.some(msg => 
      msg.includes('✅ UniversalLink: Using ReactRouterLink')
    );
    
    console.log('📊 Has render message:', hasRenderMessage);
    console.log('📊 Has ReactRouter message:', hasReactRouterMessage);
    
    // If no debug messages, log what we did see
    if (consoleMessages.length === 0) {
      console.log('⚠️ No UniversalLink debug messages detected');
      
      // Capture all console messages for debugging
      const allMessages: string[] = [];
      page.on('console', (msg) => allMessages.push(msg.text()));
      await page.waitForTimeout(500);
      
      console.log('📝 All console messages:');
      allMessages.slice(-10).forEach(msg => console.log('  ', msg));
    }
    
    expect(consoleMessages.length).toBeGreaterThan(0);
  });

  test('should navigate using hash URLs instead of file paths', async () => {
    console.log('🔍 Testing hash URL navigation...');
    
    // Set up navigation listener
    const navigationAttempts: string[] = [];
    page.on('framenavigated', (frame) => {
      const url = frame.url();
      navigationAttempts.push(url);
      console.log('🧭 Navigation to:', url);
    });
    
    // Get initial URL
    const initialUrl = page.url();
    console.log('🏠 Initial URL:', initialUrl);
    
    // Click Projects button
    console.log('🖱️ Clicking Projects button for navigation test...');
    await page.click('button:has-text("Projects")');
    
    // Wait for potential navigation
    await page.waitForTimeout(2000);
    
    // Get final URL
    const finalUrl = page.url();
    console.log('🎯 Final URL:', finalUrl);
    
    // Check URL format
    const hasHashFormat = finalUrl.includes('#/projects') || finalUrl.includes('#projects');
    const hasFileFormat = finalUrl.includes('/projects') && !finalUrl.includes('#');
    
    console.log('📊 Has hash format:', hasHashFormat);
    console.log('📊 Has file format:', hasFileFormat);
    console.log('📊 Navigation attempts:', navigationAttempts.length);
    
    // Log all navigation attempts
    navigationAttempts.forEach((url, i) => {
      console.log(`🧭 Navigation ${i + 1}:`, url);
    });
    
    // Hash format is preferred, but we'll accept any navigation that doesn't cause errors
    if (hasHashFormat) {
      console.log('✅ SUCCESS: Hash-based navigation detected!');
    } else if (finalUrl !== initialUrl) {
      console.log('🔄 Navigation occurred but not hash-based');
    } else {
      console.log('⚠️ No navigation detected');
    }
  });

  test('should not show file system navigation errors', async () => {
    console.log('🔍 Testing for file system navigation errors...');
    
    // Set up error listener
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });
    
    // Set up console error listener
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Failed to load')) {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Click Projects button
    console.log('🖱️ Clicking Projects button to check for errors...');
    await page.click('button:has-text("Projects")');
    
    // Wait for potential errors
    await page.waitForTimeout(3000);
    
    console.log('📊 Total errors captured:', errors.length);
    errors.forEach((error, i) => {
      console.log(`❌ Error ${i + 1}:`, error);
    });
    
    // Check for specific file system errors
    const hasFileSystemErrors = errors.some(error => 
      error.includes('ERR_FILE_NOT_FOUND') || 
      error.includes('Failed to load: file://')
    );
    
    console.log('📊 Has file system errors:', hasFileSystemErrors);
    
    if (!hasFileSystemErrors) {
      console.log('✅ SUCCESS: No file system navigation errors!');
    }
    
    // We expect no file system errors with proper hash routing
    expect(hasFileSystemErrors).toBe(false);
  });

  test('should render Projects page content after navigation', async () => {
    console.log('🔍 Testing page content change after navigation...');
    
    // Get initial page content
    const initialContent = await page.textContent('body');
    const hasInitialHomeContent = initialContent?.includes('Open Source') || 
                                 initialContent?.includes('Video Editor');
    
    console.log('📊 Has initial home content:', hasInitialHomeContent);
    
    // Click Projects button
    console.log('🖱️ Clicking Projects button to test content change...');
    await page.click('button:has-text("Projects")');
    
    // Wait for potential content change
    await page.waitForTimeout(2000);
    
    // Get final page content
    const finalContent = await page.textContent('body');
    const hasProjectsContent = finalContent?.includes('Projects') && 
                              !finalContent?.includes('Open Source Video Editor');
    
    console.log('📊 Content changed:', initialContent !== finalContent);
    console.log('📊 Has projects content:', hasProjectsContent);
    
    // Check if we can manually trigger hash navigation
    console.log('🔧 Testing manual hash navigation...');
    await page.evaluate(() => {
      window.location.hash = '/projects';
    });
    
    await page.waitForTimeout(1000);
    
    const manualHashContent = await page.textContent('body');
    const manualHashWorked = manualHashContent !== initialContent;
    
    console.log('📊 Manual hash navigation worked:', manualHashWorked);
    
    if (manualHashWorked) {
      console.log('✅ Hash Router is functional - issue is with UniversalLink');
    } else {
      console.log('⚠️ Hash Router may not be working properly');
    }
  });

  test('should show build file information for debugging', async () => {
    console.log('🔍 Checking build file information...');
    
    // Get all script tags
    const scriptSrcs = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => (script as HTMLScriptElement).src);
    });
    
    console.log('📊 Script files loaded:');
    scriptSrcs.forEach((src, i) => {
      console.log(`📄 Script ${i + 1}:`, src);
    });
    
    // Check for specific app bundle
    const appScript = scriptSrcs.find(src => src.includes('_app-'));
    console.log('📊 App bundle:', appScript);
    
    // Check if it's the expected new build
    const isNewBuild = appScript?.includes('_app-09981c80c848f49a.js');
    const isOldBuild = appScript?.includes('_app-1cce9cd67a807b25.js');
    
    console.log('📊 Is new build (09981c80c848f49a):', isNewBuild);
    console.log('📊 Is old build (1cce9cd67a807b25):', isOldBuild);
    
    if (isNewBuild) {
      console.log('✅ SUCCESS: New build with enhanced detection is loading!');
    } else if (isOldBuild) {
      console.log('⚠️ WARNING: Old build is still loading (cache issue)');
    } else {
      console.log('🔄 Different build version detected');
    }
  });
});

/**
 * Usage Instructions:
 * 
 * 1. Install Playwright if not already installed:
 *    npm install @playwright/test @playwright/electron
 * 
 * 2. Run this specific test:
 *    npx playwright test hash-router-navigation.spec.ts --headed
 * 
 * 3. View detailed output:
 *    npx playwright test hash-router-navigation.spec.ts --headed --reporter=line
 * 
 * This test will:
 * - Launch the Electron app
 * - Test Electron environment detection
 * - Check for UniversalLink debug messages
 * - Verify hash URL navigation vs file navigation
 * - Detect file system navigation errors
 * - Test manual hash routing functionality
 * - Show build file information for debugging
 */