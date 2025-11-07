# Sprite Animation Editor

A desktop application for creating and managing sprite sheet animations, built with Electron.

## Features

- Visual sprite sheet editor with canvas-based frame selection
- Create and manage multiple animations
- Frame manipulation (drag, resize, reorder)
- Flood-fill frame detection (Shift+Click)
- Live preview with playback controls
- Import/Export animation data to JSON
- Background color customization for editor and preview
- Zoom and pan controls
- Native file dialogs for opening sprite sheets

## Installation

Install the required dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

Start the application in development mode:

```bash
npm start
```

Or with logging enabled:

```bash
npm run dev
```

### Web Mode (Browser)

You can also run the editor in a web browser using the built-in Python server:

```bash
npm run serve
```

Then open http://localhost:8080/editor.html in your browser.

## Building for Distribution

Build standalone executables for your platform:

```bash
# Build for current platform
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

The built applications will be in the `dist` folder.

## Usage

### Loading a Sprite Sheet

1. Click **File > Open Sprite Sheet** or press `Ctrl/Cmd+O`
2. Select an image file (PNG, JPG, GIF, WEBP)
3. The sprite sheet will appear in the main canvas area

### Creating Animations

1. Click **+ New Animation** in the sidebar
2. Enter a name for your animation
3. Configure FPS and loop settings

### Adding Frames

There are two ways to add frames:

**Manual Selection:**
- Click and drag on the sprite sheet to select a frame region
- Release to add the frame to the current animation

**Auto-Detection (Flood Fill):**
- Hold `Shift` and click on a sprite
- The editor will automatically detect the sprite boundaries
- The detected frame will be added to the animation

### Editing Frames

- **Select:** Click on a frame in the frame list or on the canvas
- **Move:** Click and drag a selected frame on the canvas
- **Resize:** Drag the resize handles on a selected frame
- **Reorder:** Drag frames in the frame list to reorder
- **Delete:** Click the "Del" button on a frame
- **Adjust Duration:** Change the duration value (in ms) for each frame

### Zoom and Pan

- **Zoom In:** Click the zoom in button, press `+`, or use `Ctrl/Cmd++`
- **Zoom Out:** Click the zoom out button, press `-`, or use `Ctrl/Cmd+-`
- **Reset Zoom:** Click reset zoom, press `0`, or use `Ctrl/Cmd+0`
- **Pan:** Middle-click and drag on the canvas
- **Scroll Zoom:** Use the mouse wheel on the canvas

### Preview Animation

The preview panel shows your animation in real-time:
- **Reload:** Restart the animation from the first frame
- **Play/Pause:** Toggle animation playback
- **Stop:** Stop and reset to the first frame

### Import/Export

**Export Animation Data:**
- Click **File > Export Animation Data** or press `Ctrl/Cmd+E`
- Save your animations and sprite sheet reference to a JSON file

**Import Animation Data:**
- Click **File > Import Animation Data** or press `Ctrl/Cmd+I`
- Load previously saved animation data

## Keyboard Shortcuts

- `Ctrl/Cmd+O` - Open sprite sheet
- `Ctrl/Cmd+I` - Import animation data
- `Ctrl/Cmd+E` - Export animation data
- `Ctrl/Cmd++` or `+` - Zoom in
- `Ctrl/Cmd+-` or `-` - Zoom out
- `Ctrl/Cmd+0` or `0` - Reset zoom
- `Shift+Click` - Auto-detect sprite frame

## Project Structure

```
animation/
├── main.js           # Electron main process
├── preload.js        # Electron preload script (IPC bridge)
├── editor.html       # Application UI
├── editor.js         # Editor logic and state management
├── animator.js       # SpriteSheetAnimator class (core library)
├── package.json      # Project configuration
└── resources/        # Sprite sheet assets
```

## Testing

Run the Playwright tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

## License

MIT
