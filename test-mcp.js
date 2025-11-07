#!/usr/bin/env node
/**
 * MCP-based test runner for the sprite editor
 * This script can be used by Claude Code via MCP Playwright tools
 */

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:8080',
    editorPath: '/editor.html',
    timeout: 5000
};

// Test suite
const tests = {
    async testEditorInitialization(page) {
        console.log('Testing: Editor Initialization...');

        // Navigate to editor
        await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.editorPath);

        // Wait for editor to initialize
        await page.waitForFunction(() => window.editor !== undefined, { timeout: TEST_CONFIG.timeout });

        // Check editor instance
        const editorExists = await page.evaluate(() => window.editor instanceof Editor);
        if (!editorExists) throw new Error('Editor not initialized');

        // Check canvases are visible
        const spriteCanvas = await page.locator('#spriteCanvas').isVisible();
        const previewCanvas = await page.locator('#previewCanvas').isVisible();

        if (!spriteCanvas || !previewCanvas) {
            throw new Error('Canvases not visible');
        }

        console.log('✓ Editor initialized successfully');
        return true;
    },

    async testCreateAnimation(page) {
        console.log('Testing: Create Animation...');

        // Navigate to editor
        await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.editorPath);
        await page.waitForFunction(() => window.editor !== undefined, { timeout: TEST_CONFIG.timeout });

        // Create animation via JS evaluation
        await page.evaluate(() => {
            window.editor.state.animations['test-anim'] = {
                name: 'test-anim',
                frames: [],
                fps: 10,
                loop: true
            };
            window.editor.state.currentAnimation = 'test-anim';
            window.editor.updateUI();
        });

        // Verify animation exists
        const animExists = await page.evaluate(() => {
            return window.editor.state.animations['test-anim'] !== undefined;
        });

        if (!animExists) throw new Error('Animation not created');

        console.log('✓ Animation created successfully');
        return true;
    },

    async testLoadSprite(page) {
        console.log('Testing: Load Sprite Sheet...');

        await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.editorPath);
        await page.waitForFunction(() => window.editor !== undefined, { timeout: TEST_CONFIG.timeout });

        // Load sprite sheet
        await page.evaluate(() => {
            window.editor.loadSpriteImage('resources/animated_character_1.png');
        });

        // Wait for sprite to load
        await page.waitForTimeout(1000);

        // Verify sprite loaded
        const spriteLoaded = await page.evaluate(() => {
            return window.editor.state.spriteLoaded === true;
        });

        if (!spriteLoaded) throw new Error('Sprite not loaded');

        console.log('✓ Sprite sheet loaded successfully');
        return true;
    },

    async testFrameSelection(page) {
        console.log('Testing: Frame Selection...');

        await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.editorPath);
        await page.waitForFunction(() => window.editor !== undefined, { timeout: TEST_CONFIG.timeout });

        // Setup: create animation with a frame
        await page.evaluate(() => {
            window.editor.loadSpriteImage('resources/animated_character_1.png');
            window.editor.state.animations['test-anim'] = {
                name: 'test-anim',
                frames: [
                    { x: 10, y: 10, width: 50, height: 50, duration: 100 }
                ],
                fps: 10,
                loop: true
            };
            window.editor.state.currentAnimation = 'test-anim';
            window.editor.updateUI();
            window.editor.drawSpriteCanvas();
        });

        await page.waitForTimeout(500);

        // Click on frame to select it
        const canvas = page.locator('#spriteCanvas');
        await canvas.click({ position: { x: 30, y: 30 } });

        // Verify frame is selected
        const selectedIndex = await page.evaluate(() => {
            return window.editor.state.selectedFrameIndex;
        });

        if (selectedIndex !== 0) throw new Error('Frame not selected');

        console.log('✓ Frame selected successfully');
        return true;
    },

    async testConsoleErrors(page) {
        console.log('Testing: Console Errors...');

        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(TEST_CONFIG.baseUrl + TEST_CONFIG.editorPath);
        await page.waitForFunction(() => window.editor !== undefined, { timeout: TEST_CONFIG.timeout });

        // Interact with editor
        await page.evaluate(() => {
            window.editor.state.animations['test'] = {
                name: 'test',
                frames: [],
                fps: 10,
                loop: true
            };
            window.editor.updateUI();
        });

        await page.waitForTimeout(1000);

        if (errors.length > 0) {
            throw new Error(`Console errors detected: ${errors.join(', ')}`);
        }

        console.log('✓ No console errors detected');
        return true;
    }
};

// Main test runner
async function runTests() {
    console.log('=================================');
    console.log('Sprite Editor MCP Test Suite');
    console.log('=================================\n');

    const results = {
        passed: 0,
        failed: 0,
        total: Object.keys(tests).length
    };

    // Note: This requires Playwright to be available
    // When running via MCP, the page object will be provided
    console.log('Note: This script requires Playwright MCP tools to be available.');
    console.log('Run via Claude Code with MCP Playwright support.\n');

    return results;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tests, TEST_CONFIG, runTests };
}

// If run directly, show usage
if (require.main === module) {
    console.log('=================================');
    console.log('Sprite Editor MCP Test Suite');
    console.log('=================================\n');
    console.log('This test suite is designed to be run via Claude Code with Playwright MCP tools.');
    console.log('\nAvailable tests:');
    Object.keys(tests).forEach(testName => {
        console.log(`  - ${testName}`);
    });
    console.log('\nTo run tests, use the npm test command instead:');
    console.log('  npm test');
}
