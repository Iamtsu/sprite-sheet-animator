/**
 * Playwright test for the sprite editor
 * Run with: npx playwright test test-editor.js
 */

const { test, expect } = require('@playwright/test');

test.describe('Sprite Editor', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the editor
        await page.goto('http://localhost:8080/editor.html');

        // Wait for the editor to initialize
        await page.waitForFunction(() => window.editor !== undefined);
    });

    test('should initialize the editor', async ({ page }) => {
        // Check that the editor instance exists
        const editorExists = await page.evaluate(() => {
            return window.editor instanceof Editor;
        });
        expect(editorExists).toBe(true);

        // Check that canvases are present
        const spriteCanvas = await page.locator('#spriteCanvas');
        const previewCanvas = await page.locator('#previewCanvas');
        await expect(spriteCanvas).toBeVisible();
        await expect(previewCanvas).toBeVisible();
    });

    test('should create a new animation', async ({ page }) => {
        // Click the "New Animation" button
        const newAnimButton = page.locator('button', { hasText: '+ New Animation' });
        await newAnimButton.click();

        // Handle the prompt dialog
        page.on('dialog', async dialog => {
            expect(dialog.type()).toBe('prompt');
            await dialog.accept('test-animation');
        });

        // Wait for animation to be created
        await page.waitForTimeout(500);

        // Verify animation was created
        const animationExists = await page.evaluate(() => {
            return window.editor.state.animations['test-animation'] !== undefined;
        });
        expect(animationExists).toBe(true);

        // Check that animation config is visible
        const animConfig = page.locator('#animationConfig');
        await expect(animConfig).toBeVisible();
    });

    test('should load a sprite sheet from URL', async ({ page }) => {
        // Enter a sprite sheet URL
        const urlInput = page.locator('#spriteUrl');
        await urlInput.fill('resources/animated_character_1.png');

        // Click load button
        const loadButton = page.locator('button', { hasText: 'Load' }).first();
        await loadButton.click();

        // Wait for image to load
        await page.waitForTimeout(1000);

        // Verify sprite was loaded
        const spriteLoaded = await page.evaluate(() => {
            return window.editor.state.spriteLoaded === true;
        });
        expect(spriteLoaded).toBe(true);

        // Take screenshot to verify
        await page.screenshot({ path: 'test-results/sprite-loaded.png' });
    });

    test('should add frames by clicking on canvas', async ({ page }) => {
        // First load a sprite
        await page.evaluate(() => {
            window.editor.loadSpriteImage('resources/animated_character_1.png');
        });
        await page.waitForTimeout(500);

        // Create an animation
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

        // Click and drag on canvas to create a frame
        const canvas = page.locator('#spriteCanvas');
        await canvas.click({ position: { x: 10, y: 10 } });
        await page.mouse.move(50, 50);
        await page.mouse.down();
        await page.mouse.move(100, 100);
        await page.mouse.up();

        // Verify frame was added
        const frameCount = await page.evaluate(() => {
            return window.editor.state.animations['test-anim'].frames.length;
        });
        expect(frameCount).toBeGreaterThan(0);
    });

    test('should select and resize frames', async ({ page }) => {
        // Setup: load sprite and create animation with frames
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

        // Click on the frame to select it
        const canvas = page.locator('#spriteCanvas');
        await canvas.click({ position: { x: 30, y: 30 } });

        // Verify frame is selected
        const selectedIndex = await page.evaluate(() => {
            return window.editor.state.selectedFrameIndex;
        });
        expect(selectedIndex).toBe(0);

        // Take screenshot showing selected frame with handles
        await page.screenshot({ path: 'test-results/frame-selected.png' });
    });

    test('should export to JSON', async ({ page }) => {
        // Setup animation data
        await page.evaluate(() => {
            window.editor.state.animations['export-test'] = {
                name: 'export-test',
                frames: [
                    { x: 0, y: 0, width: 64, height: 64, duration: 100 }
                ],
                fps: 10,
                loop: true
            };
        });

        // Listen for download
        const downloadPromise = page.waitForEvent('download');

        // Click export button
        const exportButton = page.locator('button', { hasText: 'Export JSON' });
        await exportButton.click();

        // Verify download started
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('animations.json');
    });

    test('should not have console errors', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Interact with the editor
        await page.evaluate(() => {
            window.editor.createNewAnimation();
        });

        page.on('dialog', async dialog => await dialog.accept('test'));
        await page.waitForTimeout(1000);

        // Check for errors
        expect(errors).toHaveLength(0);
    });
});
