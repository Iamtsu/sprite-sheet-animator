---
description: Run browser tests for the sprite editor using Playwright MCP
---

You are tasked with testing the sprite animation editor using Playwright MCP tools.

## Test Configuration
- Base URL: http://localhost:8080
- Editor Path: /editor.html
- Timeout: 5000ms

## Test Steps

Execute the following tests using the MCP Playwright tools (mcp__playwright__*):

### 1. Start HTTP Server
First, check if a server is running. If not, start one:
```bash
python3 -m http.server 8080
```

### 2. Test Suite

Run each test in sequence and report results:

#### Test 1: Editor Initialization
- Navigate to http://localhost:8080/editor.html
- Wait for the page to load
- Take a screenshot
- Evaluate JavaScript: `window.editor instanceof Editor`
- Verify both #spriteCanvas and #previewCanvas are visible
- Report: ✓ or ✗

#### Test 2: Create Animation
- Navigate to http://localhost:8080/editor.html
- Wait for editor to initialize
- Evaluate JavaScript to create an animation:
  ```javascript
  window.editor.state.animations['test-anim'] = {
      name: 'test-anim',
      frames: [],
      fps: 10,
      loop: true
  };
  window.editor.state.currentAnimation = 'test-anim';
  window.editor.updateUI();
  ```
- Verify animation exists in state
- Report: ✓ or ✗

#### Test 3: Load Sprite Sheet
- Navigate to http://localhost:8080/editor.html
- Evaluate JavaScript: `window.editor.loadSpriteImage('resources/animated_character_1.png')`
- Wait 1 second for image to load
- Evaluate: `window.editor.state.spriteLoaded === true`
- Take a screenshot showing loaded sprite
- Report: ✓ or ✗

#### Test 4: Frame Selection
- Navigate to http://localhost:8080/editor.html
- Setup animation with a frame via JavaScript:
  ```javascript
  window.editor.loadSpriteImage('resources/animated_character_1.png');
  window.editor.state.animations['test-anim'] = {
      name: 'test-anim',
      frames: [{ x: 10, y: 10, width: 50, height: 50, duration: 100 }],
      fps: 10,
      loop: true
  };
  window.editor.state.currentAnimation = 'test-anim';
  window.editor.updateUI();
  window.editor.drawSpriteCanvas();
  ```
- Click on canvas at position (30, 30)
- Verify `window.editor.state.selectedFrameIndex === 0`
- Take screenshot showing selected frame
- Report: ✓ or ✗

#### Test 5: Console Errors
- Navigate to http://localhost:8080/editor.html
- Get console messages
- Interact with the editor (create animation, etc.)
- Check for any console errors
- Report: ✓ or ✗

### 3. Test Summary

After running all tests, provide a summary:
- Total tests: X
- Passed: X
- Failed: X
- Screenshots saved

## Output Format

Present results in a clear table format:
```
Test Results
============
✓ Editor Initialization
✓ Create Animation
✓ Load Sprite Sheet
✓ Frame Selection
✓ Console Errors

Summary: 5/5 tests passed
```

Include any screenshots or error details for failed tests.
