# Testing the Sprite Animation Editor

## Prerequisites

Install Playwright:
```bash
npm install
npx playwright install
```

## Running Tests

### Automated Tests with Playwright

Run all tests:
```bash
npm test
```

Run tests in UI mode (interactive):
```bash
npm run test:ui
```

Run specific test:
```bash
npx playwright test test-editor.js -g "should initialize"
```

### Manual Testing

1. Start the development server:
```bash
npm run serve
```

2. Open your browser to: `http://localhost:8080/editor.html`

3. Test the following features:
   - Load a sprite sheet (use `resources/animated_character_1.png`)
   - Create a new animation
   - Click and drag to select frames on the sprite sheet
   - Click on a frame to select it
   - Drag the resize handles to adjust frame dimensions
   - Drag frames in the frame list to reorder them
   - Adjust FPS and loop settings
   - Test the preview controls (play/pause/stop)
   - Export animation to JSON
   - Import animation from JSON

## Test Coverage

The automated tests cover:
- ✓ Editor initialization
- ✓ Creating new animations
- ✓ Loading sprite sheets from URL
- ✓ Adding frames by clicking on canvas
- ✓ Selecting and resizing frames
- ✓ Exporting to JSON
- ✓ Console error checking

## Debugging Tests

Generate debug traces:
```bash
npx playwright test --trace on
```

View test report:
```bash
npx playwright show-report
```

## Test Results

Test screenshots and artifacts are saved to:
- `test-results/` - Screenshots on failure
- `playwright-report/` - HTML test report
