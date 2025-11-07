# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JavaScript sprite sheet animation library containing the `SpriteSheetAnimator` class. 
The library is designed for browser-based canvas animations and provides a simple API for managing frame-based animations from sprite sheets.

## Architecture

### Core Components

**SpriteSheetAnimator Class** (`animator.js`)
- Handles loading and rendering sprite sheet images
- Manages multiple named animations per sprite sheet instance
- Provides two animation definition methods:
  - `addAnimation()`: Manual frame-by-frame definition using pixel coordinates
  - `addAnimationFromGrid()`: Grid-based definition using row/column indices
- Uses delta-time-based frame advancement for smooth animations
- Supports both looping and one-shot animations with completion callbacks

### Key Design Patterns

**Promise-based Loading**: The class uses `loadPromise` to handle asynchronous image loading. Always call `waitForLoad()` before attempting to render.

**Frame Timing**: The `update(deltaTime)` method accumulates time and advances frames based on the configured `frameRate`. The typical game loop pattern is:
```javascript
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    animator.update(deltaTime);
    animator.draw(ctx, x, y);
    requestAnimationFrame(gameLoop);
}
```

**Sprite Sheet Coordinate System**: The class supports offset-based sprite sheets via `offsetX` and `offsetY`, allowing animations to be extracted from larger sprite atlases.

## Development

### Project Structure
- `animator.js` - Main animator class (standalone, no dependencies)
- `resources/` - Contains sprite sheet assets (e.g., `animated_character_1.png`)
- `index.html` - Currently empty, intended as demo/test page

### Testing the Library
Since there's no build system or test framework, test changes by:
1. Creating or updating `index.html` with a canvas element and script tag
2. Opening `index.html` in a browser
3. Using browser DevTools console to debug

Example minimal test setup:
```html
<!DOCTYPE html>
<html>
<body>
    <canvas id="canvas" width="800" height="600"></canvas>
    <script src="animator.js"></script>
    <script>
        // Test code here
    </script>
</body>
</html>
```

## Important Implementation Details

### Frame Coordinate Calculation
When using `addAnimationFromGrid()`, frame positions are calculated as:
- X: `offsetX + (startCol + frameIndex) * frameWidth`
- Y: `offsetY + row * frameHeight`

This assumes sprite sheets are organized in a regular grid with consistent frame dimensions.

### Animation State Management
The class maintains these key state variables:
- `currentAnimation`: Name of active animation
- `currentFrame`: Index into the animation's frames array
- `frameTime`: Accumulated time toward next frame advance
- `isPlaying`: Whether animation is actively advancing

Changing animations via `play(name)` resets `currentFrame` and `frameTime` unless the same animation is already playing.
