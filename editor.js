import { SpriteSheetAnimator } from './animator.js';

/**
 * Sprite Sheet Animation Editor
 * A visual editor for creating frame-based sprite animations
 */
class Editor {
    constructor() {
        // State
        this.state = {
            spriteImage: null,
            spriteLoaded: false,
            animations: {},
            currentAnimation: null,
            draggedFrame: null,
            selectedFrameIndex: null,
            selection: {
                isSelecting: false,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0
            },
            resize: {
                isResizing: false,
                handle: null, // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
                startX: 0,
                startY: 0,
                originalFrame: null
            },
            drag: {
                isDragging: false,
                startX: 0,
                startY: 0,
                originalX: 0,
                originalY: 0
            }
        };

        // Preview animation state
        this.previewState = {
            currentFrame: 0,
            frameTime: 0,
            lastTimestamp: 0,
            isPlaying: true
        };

        // SpriteSheetAnimator instance for preview
        this.animator = null;

        // Zoom and pan state
        this.zoomState = {
            scale: 1,
            minScale: 0.1,
            maxScale: 10,
            panX: 0,
            panY: 0,
            isPanning: false,
            panStartX: 0,
            panStartY: 0
        };

        // Canvas references
        this.spriteCanvas = document.getElementById('spriteCanvas');
        this.spriteCtx = this.spriteCanvas.getContext('2d');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Initialize
        this.setupEventListeners();
        this.resizeSpriteCanvas();
        this.loadFromLocalStorage();
        this.updateUI();
        this.startPreviewLoop();
    }

    resizeSpriteCanvas() {
        // Get the container dimensions
        const container = this.spriteCanvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Account for padding (20px on each side)
        const availableWidth = rect.width - 40;
        const availableHeight = rect.height - 40;

        // Set canvas to fill available space
        this.spriteCanvas.width = availableWidth;
        this.spriteCanvas.height = availableHeight;

        // Redraw if we have an image loaded
        if (this.state.spriteLoaded) {
            this.drawSpriteCanvas();
        }
    }

    fitImageToCanvas() {
        if (!this.state.spriteImage) return;

        const img = this.state.spriteImage;
        const canvasWidth = this.spriteCanvas.width;
        const canvasHeight = this.spriteCanvas.height;

        // Calculate scale to fit image in canvas (with some padding)
        const padding = 40; // px padding around the image
        const scaleX = (canvasWidth - padding * 2) / img.width;
        const scaleY = (canvasHeight - padding * 2) / img.height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

        // Center the image
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const panX = (canvasWidth - scaledWidth) / 2;
        const panY = (canvasHeight - scaledHeight) / 2;

        // Update zoom state
        this.zoomState.scale = scale;
        this.zoomState.panX = panX;
        this.zoomState.panY = panY;

        // Update zoom display
        document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeSpriteCanvas();
        });
        // Sprite canvas mouse events
        this.spriteCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.spriteCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.spriteCanvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.spriteCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e), { passive: false });

        // Prevent default middle mouse button behavior (auto-scroll)
        this.spriteCanvas.addEventListener('contextmenu', (e) => {
            if (e.button === 1) e.preventDefault();
        });
        this.spriteCanvas.addEventListener('auxclick', (e) => {
            if (e.button === 1) e.preventDefault();
        });

        // Keyboard shortcuts for zoom
        document.addEventListener('keydown', (e) => {
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                this.zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                this.zoomOut();
            } else if (e.key === '0' || e.key === ')') {
                e.preventDefault();
                this.resetZoom();
            }
        });
    }

    // Sprite loading
    loadSpriteFile() {
        document.getElementById('spriteFileInput').click();
    }

    handleSpriteFile(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.loadSpriteImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    loadSpriteUrl() {
        const url = document.getElementById('spriteUrl').value;
        if (url) {
            this.loadSpriteImage(url);
        }
    }

    loadSpriteImage(src) {
        const img = new Image();
        img.onload = () => {
            this.state.spriteImage = img;
            this.state.spriteLoaded = true;
            // Canvas size is already set by resizeSpriteCanvas()

            // Center and fit the image in the canvas
            this.fitImageToCanvas();
            this.drawSpriteCanvas();

            // Create animator instance with the loaded sprite
            this.animator = new SpriteSheetAnimator(src);
            this.animator.waitForLoad().then(() => {
                this.syncAnimatorState();
            });

            this.saveToLocalStorage();
        };
        img.onerror = () => {
            alert('Failed to load image');
        };
        img.src = src;
    }

    // Zoom functions
    zoomIn() {
        this.setZoom(this.zoomState.scale * 1.2);
    }

    zoomOut() {
        this.setZoom(this.zoomState.scale / 1.2);
    }

    resetZoom() {
        // Fit and center the image in the canvas
        this.fitImageToCanvas();
        this.drawSpriteCanvas();
    }

    setZoom(newScale) {
        // Clamp zoom level
        newScale = Math.max(this.zoomState.minScale, Math.min(this.zoomState.maxScale, newScale));

        // Get canvas center point
        const centerX = this.spriteCanvas.width / 2;
        const centerY = this.spriteCanvas.height / 2;

        // Adjust pan to zoom towards center
        const scaleFactor = newScale / this.zoomState.scale;
        this.zoomState.panX = centerX - (centerX - this.zoomState.panX) * scaleFactor;
        this.zoomState.panY = centerY - (centerY - this.zoomState.panY) * scaleFactor;

        this.zoomState.scale = newScale;
        this.updateZoomDisplay();
        this.drawSpriteCanvas();
    }

    updateZoomDisplay() {
        const zoomPercent = Math.round(this.zoomState.scale * 100);
        document.getElementById('zoomLevel').textContent = `${zoomPercent}%`;
    }

    // Animation management
    createNewAnimation() {
        const name = prompt('Animation name:');
        if (!name) return;
        if (this.state.animations[name]) {
            alert('Animation already exists');
            return;
        }

        this.state.animations[name] = {
            name: name,
            frames: [],
            fps: 10,
            loop: true
        };

        this.state.currentAnimation = name;
        this.updateUI();
        this.saveToLocalStorage();
    }

    selectAnimation(name) {
        this.state.currentAnimation = name;
        this.state.selectedFrameIndex = null;
        this.resetPreviewState();
        this.previewState.isPlaying = true;
        this.updatePlayPauseButton();
        this.syncAnimatorState();
        this.updateUI();
        this.drawSpriteCanvas();
    }

    resetPreviewState() {
        this.previewState.currentFrame = 0;
        this.previewState.frameTime = 0;
    }

    deleteAnimation(name) {
        if (!confirm(`Delete animation "${name}"?`)) return;
        delete this.state.animations[name];
        if (this.state.currentAnimation === name) {
            this.state.currentAnimation = null;
        }
        this.updateUI();
        this.saveToLocalStorage();
    }

    updateAnimationName() {
        const newName = document.getElementById('animationName').value;
        const oldName = this.state.currentAnimation;
        if (newName && newName !== oldName && !this.state.animations[newName]) {
            this.state.animations[newName] = this.state.animations[oldName];
            this.state.animations[newName].name = newName;
            delete this.state.animations[oldName];
            this.state.currentAnimation = newName;
            this.updateUI();
            this.saveToLocalStorage();
        }
    }

    updateAnimationConfig() {
        if (!this.state.currentAnimation) return;
        const anim = this.state.animations[this.state.currentAnimation];
        anim.fps = parseInt(document.getElementById('animationFPS').value) || 10;
        anim.loop = document.getElementById('animationLoop').checked;
        this.resetPreviewState();
        this.previewState.isPlaying = true;
        this.updatePlayPauseButton();
        this.syncAnimatorState();
        this.saveToLocalStorage();
    }

    // Sync the current animation to the SpriteSheetAnimator
    syncAnimatorState() {
        if (!this.animator || !this.state.currentAnimation) return;

        const anim = this.state.animations[this.state.currentAnimation];
        if (!anim || anim.frames.length === 0) return;

        // Add or update the animation in the animator
        this.animator.addAnimation(this.state.currentAnimation, {
            frames: anim.frames,
            fps: anim.fps,
            loop: anim.loop
        });

        // Play the animation
        this.animator.play(this.state.currentAnimation, true);
        if (!this.previewState.isPlaying) {
            this.animator.pause();
        }
    }

    // Frame management
    addFrame(x, y, width, height) {
        if (!this.state.currentAnimation) {
            alert('Please select or create an animation first');
            return;
        }

        const anim = this.state.animations[this.state.currentAnimation];
        anim.frames.push({
            x: x,
            y: y,
            width: width,
            height: height,
            duration: 1000 / anim.fps
        });

        this.syncAnimatorState();
        this.updateUI();
        this.drawSpriteCanvas();
        this.saveToLocalStorage();
    }

    deleteFrame(index) {
        if (!this.state.currentAnimation) return;
        this.state.animations[this.state.currentAnimation].frames.splice(index, 1);

        // Reset preview if we deleted the current or a previous frame
        if (this.previewState.currentFrame >= index) {
            this.resetPreviewState();
        }

        // Clear selection if deleted frame was selected
        if (this.state.selectedFrameIndex === index) {
            this.state.selectedFrameIndex = null;
        } else if (this.state.selectedFrameIndex > index) {
            this.state.selectedFrameIndex--;
        }

        this.syncAnimatorState();
        this.updateUI();
        this.drawSpriteCanvas();
        this.saveToLocalStorage();
    }

    updateFrameDuration(index, duration) {
        if (!this.state.currentAnimation) return;
        this.state.animations[this.state.currentAnimation].frames[index].duration = parseFloat(duration);
        this.syncAnimatorState();
        this.saveToLocalStorage();
    }

    moveFrame(fromIndex, toIndex) {
        if (!this.state.currentAnimation) return;
        const frames = this.state.animations[this.state.currentAnimation].frames;
        const [frame] = frames.splice(fromIndex, 1);
        frames.splice(toIndex, 0, frame);

        // Update selected index if the selected frame was moved
        if (this.state.selectedFrameIndex === fromIndex) {
            this.state.selectedFrameIndex = toIndex;
        } else if (this.state.selectedFrameIndex > fromIndex && this.state.selectedFrameIndex <= toIndex) {
            this.state.selectedFrameIndex--;
        } else if (this.state.selectedFrameIndex < fromIndex && this.state.selectedFrameIndex >= toIndex) {
            this.state.selectedFrameIndex++;
        }

        this.syncAnimatorState();
        this.updateUI();
        this.drawSpriteCanvas();
        this.saveToLocalStorage();
    }

    selectFrame(index) {
        this.state.selectedFrameIndex = index;
        this.updateUI();
        this.drawSpriteCanvas();
    }

    updateFrame(index, x, y, width, height) {
        if (!this.state.currentAnimation) return;
        const frame = this.state.animations[this.state.currentAnimation].frames[index];
        frame.x = Math.round(x);
        frame.y = Math.round(y);
        frame.width = Math.round(width);
        frame.height = Math.round(height);
        this.syncAnimatorState();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // Canvas drawing helpers
    drawResizeHandles(frame) {
        const handleSize = 8;
        const handles = this.getResizeHandles(frame, handleSize);

        this.spriteCtx.fillStyle = '#0d7377';
        this.spriteCtx.strokeStyle = 'white';
        this.spriteCtx.lineWidth = 1;

        Object.values(handles).forEach(handle => {
            this.spriteCtx.fillRect(handle.x, handle.y, handleSize, handleSize);
            this.spriteCtx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
    }

    getResizeHandles(frame, handleSize) {
        const hs = handleSize / 2;
        return {
            nw: { x: frame.x - hs, y: frame.y - hs },
            n:  { x: frame.x + frame.width / 2 - hs, y: frame.y - hs },
            ne: { x: frame.x + frame.width - hs, y: frame.y - hs },
            e:  { x: frame.x + frame.width - hs, y: frame.y + frame.height / 2 - hs },
            se: { x: frame.x + frame.width - hs, y: frame.y + frame.height - hs },
            s:  { x: frame.x + frame.width / 2 - hs, y: frame.y + frame.height - hs },
            sw: { x: frame.x - hs, y: frame.y + frame.height - hs },
            w:  { x: frame.x - hs, y: frame.y + frame.height / 2 - hs }
        };
    }

    getHandleAtPoint(frame, x, y, handleSize = 8) {
        const handles = this.getResizeHandles(frame, handleSize);
        for (let [name, handle] of Object.entries(handles)) {
            if (x >= handle.x && x <= handle.x + handleSize &&
                y >= handle.y && y <= handle.y + handleSize) {
                return name;
            }
        }
        return null;
    }

    isPointInFrame(frame, x, y) {
        return x >= frame.x && x <= frame.x + frame.width &&
               y >= frame.y && y <= frame.y + frame.height;
    }

    // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
    screenToCanvas(screenX, screenY) {
        const x = (screenX - this.zoomState.panX) / this.zoomState.scale;
        const y = (screenY - this.zoomState.panY) / this.zoomState.scale;
        return { x, y };
    }

    // Canvas drawing
    drawSpriteCanvas() {
        if (!this.state.spriteLoaded) return;

        // Clear the entire canvas
        this.spriteCtx.clearRect(0, 0, this.spriteCanvas.width, this.spriteCanvas.height);

        // Save the context state
        this.spriteCtx.save();

        // Apply zoom and pan transforms
        this.spriteCtx.translate(this.zoomState.panX, this.zoomState.panY);
        this.spriteCtx.scale(this.zoomState.scale, this.zoomState.scale);

        // Draw the sprite image at origin
        this.spriteCtx.drawImage(this.state.spriteImage, 0, 0);

        // Draw frame overlays
        if (this.state.currentAnimation) {
            const anim = this.state.animations[this.state.currentAnimation];

            anim.frames.forEach((frame, index) => {
                const isSelected = index === this.state.selectedFrameIndex;

                // Draw frame overlay
                this.spriteCtx.fillStyle = isSelected ? 'rgba(13, 115, 119, 0.3)' : 'rgba(0, 150, 200, 0.3)';
                this.spriteCtx.strokeStyle = isSelected ? 'rgba(13, 115, 119, 1)' : 'rgba(0, 150, 200, 0.8)';
                this.spriteCtx.lineWidth = isSelected ? 3 : 2;

                this.spriteCtx.fillRect(frame.x, frame.y, frame.width, frame.height);
                this.spriteCtx.strokeRect(frame.x, frame.y, frame.width, frame.height);

                // Draw frame number
                this.spriteCtx.fillStyle = 'white';
                this.spriteCtx.font = isSelected ? 'bold 14px sans-serif' : '14px sans-serif';
                this.spriteCtx.fillText(index + 1, frame.x + 5, frame.y + 20);
            });

            // Draw resize handles for selected frame
            if (this.state.selectedFrameIndex !== null && this.state.selectedFrameIndex < anim.frames.length) {
                this.drawResizeHandles(anim.frames[this.state.selectedFrameIndex]);
            }
        }

        // Draw current selection
        if (this.state.selection.isSelecting) {
            const x = Math.min(this.state.selection.startX, this.state.selection.currentX);
            const y = Math.min(this.state.selection.startY, this.state.selection.currentY);
            const w = Math.abs(this.state.selection.currentX - this.state.selection.startX);
            const h = Math.abs(this.state.selection.currentY - this.state.selection.startY);

            this.spriteCtx.strokeStyle = 'yellow';
            this.spriteCtx.lineWidth = 2;
            this.spriteCtx.strokeRect(x, y, w, h);
            this.spriteCtx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            this.spriteCtx.fillRect(x, y, w, h);
        }

        // Restore the context state
        this.spriteCtx.restore();
    }

    // Mouse event handlers
    handleCanvasMouseDown(e) {
        if (!this.state.spriteLoaded) return;

        const rect = this.spriteCanvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = this.screenToCanvas(screenX, screenY);

        // Check for middle mouse button (pan mode)
        if (e.button === 1) {
            e.preventDefault();
            this.zoomState.isPanning = true;
            this.zoomState.panStartX = screenX - this.zoomState.panX;
            this.zoomState.panStartY = screenY - this.zoomState.panY;
            this.spriteCanvas.style.cursor = 'grabbing';
            return;
        }

        // Only handle left mouse button for frame operations
        if (e.button !== 0) return;

        // Check if clicking on a resize handle of the selected frame
        if (this.state.currentAnimation && this.state.selectedFrameIndex !== null) {
            const anim = this.state.animations[this.state.currentAnimation];
            const selectedFrame = anim.frames[this.state.selectedFrameIndex];
            if (selectedFrame) {
                const handle = this.getHandleAtPoint(selectedFrame, x, y);
                if (handle) {
                    this.state.resize.isResizing = true;
                    this.state.resize.handle = handle;
                    this.state.resize.startX = x;
                    this.state.resize.startY = y;
                    this.state.resize.originalFrame = { ...selectedFrame };
                    return;
                }

                // Check if clicking inside the selected frame (to drag it)
                if (this.isPointInFrame(selectedFrame, x, y)) {
                    this.state.drag.isDragging = true;
                    this.state.drag.startX = x;
                    this.state.drag.startY = y;
                    this.state.drag.originalX = selectedFrame.x;
                    this.state.drag.originalY = selectedFrame.y;
                    this.spriteCanvas.style.cursor = 'move';
                    return;
                }
            }
        }

        // Check if clicking on any frame
        if (this.state.currentAnimation) {
            const anim = this.state.animations[this.state.currentAnimation];
            // Check frames in reverse order (top to bottom in display)
            for (let i = anim.frames.length - 1; i >= 0; i--) {
                if (this.isPointInFrame(anim.frames[i], x, y)) {
                    this.selectFrame(i);
                    return;
                }
            }
        }

        // Otherwise, start new selection
        this.state.selectedFrameIndex = null;
        this.state.selection.isSelecting = true;
        this.state.selection.startX = x;
        this.state.selection.startY = y;
        this.state.selection.currentX = x;
        this.state.selection.currentY = y;
        this.drawSpriteCanvas();
    }

    handleCanvasMouseMove(e) {
        const rect = this.spriteCanvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Handle panning
        if (this.zoomState.isPanning) {
            this.zoomState.panX = screenX - this.zoomState.panStartX;
            this.zoomState.panY = screenY - this.zoomState.panStartY;
            this.drawSpriteCanvas();
            return;
        }

        const { x, y } = this.screenToCanvas(screenX, screenY);

        // Handle dragging frame
        if (this.state.drag.isDragging && this.state.selectedFrameIndex !== null) {
            const dx = x - this.state.drag.startX;
            const dy = y - this.state.drag.startY;
            const newX = this.state.drag.originalX + dx;
            const newY = this.state.drag.originalY + dy;

            const frame = this.state.animations[this.state.currentAnimation].frames[this.state.selectedFrameIndex];
            this.updateFrame(this.state.selectedFrameIndex, newX, newY, frame.width, frame.height);
            this.drawSpriteCanvas();
            return;
        }

        // Handle resizing
        if (this.state.resize.isResizing && this.state.selectedFrameIndex !== null) {
            const dx = x - this.state.resize.startX;
            const dy = y - this.state.resize.startY;
            const orig = this.state.resize.originalFrame;
            const handle = this.state.resize.handle;

            let newX = orig.x;
            let newY = orig.y;
            let newWidth = orig.width;
            let newHeight = orig.height;

            // Calculate new dimensions based on handle
            if (handle.includes('n')) {
                newY = orig.y + dy;
                newHeight = orig.height - dy;
            }
            if (handle.includes('s')) {
                newHeight = orig.height + dy;
            }
            if (handle.includes('w')) {
                newX = orig.x + dx;
                newWidth = orig.width - dx;
            }
            if (handle.includes('e')) {
                newWidth = orig.width + dx;
            }

            // Enforce minimum size
            if (newWidth < 5) {
                newWidth = 5;
                if (handle.includes('w')) newX = orig.x + orig.width - 5;
            }
            if (newHeight < 5) {
                newHeight = 5;
                if (handle.includes('n')) newY = orig.y + orig.height - 5;
            }

            this.updateFrame(this.state.selectedFrameIndex, newX, newY, newWidth, newHeight);
            this.drawSpriteCanvas();
            return;
        }

        // Handle new frame selection
        if (this.state.selection.isSelecting) {
            this.state.selection.currentX = x;
            this.state.selection.currentY = y;
            this.drawSpriteCanvas();
        }

        // Update cursor based on hover
        if (this.state.currentAnimation && this.state.selectedFrameIndex !== null) {
            const anim = this.state.animations[this.state.currentAnimation];
            const selectedFrame = anim.frames[this.state.selectedFrameIndex];
            if (selectedFrame) {
                const handle = this.getHandleAtPoint(selectedFrame, x, y);
                if (handle) {
                    const cursors = {
                        'nw': 'nwse-resize', 'se': 'nwse-resize',
                        'ne': 'nesw-resize', 'sw': 'nesw-resize',
                        'n': 'ns-resize', 's': 'ns-resize',
                        'e': 'ew-resize', 'w': 'ew-resize'
                    };
                    this.spriteCanvas.style.cursor = cursors[handle];
                    return;
                }
                // Show move cursor when hovering over selected frame
                if (this.isPointInFrame(selectedFrame, x, y)) {
                    this.spriteCanvas.style.cursor = 'move';
                    return;
                }
            }
        }
        this.spriteCanvas.style.cursor = 'crosshair';
    }

    handleCanvasMouseUp(e) {
        // End panning
        if (this.zoomState.isPanning) {
            this.zoomState.isPanning = false;
            this.spriteCanvas.style.cursor = 'crosshair';
            return;
        }

        // End dragging frame
        if (this.state.drag.isDragging) {
            this.state.drag.isDragging = false;
            this.spriteCanvas.style.cursor = 'crosshair';
            return;
        }

        // End resizing
        if (this.state.resize.isResizing) {
            this.state.resize.isResizing = false;
            this.state.resize.handle = null;
            this.state.resize.originalFrame = null;
            return;
        }

        // End new frame selection
        if (this.state.selection.isSelecting) {
            const rect = this.spriteCanvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const canvasCoords = this.screenToCanvas(screenX, screenY);
            this.state.selection.currentX = canvasCoords.x;
            this.state.selection.currentY = canvasCoords.y;

            const x = Math.min(this.state.selection.startX, this.state.selection.currentX);
            const y = Math.min(this.state.selection.startY, this.state.selection.currentY);
            const w = Math.abs(this.state.selection.currentX - this.state.selection.startX);
            const h = Math.abs(this.state.selection.currentY - this.state.selection.startY);

            if (w > 5 && h > 5) {
                this.addFrame(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
            }

            this.state.selection.isSelecting = false;
            this.drawSpriteCanvas();
        }
    }

    handleCanvasWheel(e) {
        e.preventDefault();

        const rect = this.spriteCanvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Get the canvas position before zoom
        const beforeZoom = this.screenToCanvas(screenX, screenY);

        // Calculate new zoom level
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        let newScale = this.zoomState.scale * zoomFactor;
        newScale = Math.max(this.zoomState.minScale, Math.min(this.zoomState.maxScale, newScale));

        // Update scale
        this.zoomState.scale = newScale;

        // Get the canvas position after zoom
        const afterZoom = this.screenToCanvas(screenX, screenY);

        // Adjust pan to keep the mouse position fixed
        this.zoomState.panX += (afterZoom.x - beforeZoom.x) * this.zoomState.scale;
        this.zoomState.panY += (afterZoom.y - beforeZoom.y) * this.zoomState.scale;

        this.updateZoomDisplay();
        this.drawSpriteCanvas();
    }

    // UI updates
    updateUI() {
        // Update animation list
        const animList = document.getElementById('animationList');
        animList.innerHTML = '';

        Object.keys(this.state.animations).forEach(name => {
            const li = document.createElement('li');
            li.className = 'animation-item' + (name === this.state.currentAnimation ? ' active' : '');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'animation-item-name';
            nameSpan.textContent = name;
            nameSpan.onclick = () => this.selectAnimation(name);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'animation-item-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteAnimation(name);
            };

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            animList.appendChild(li);
        });

        // Update animation config
        if (this.state.currentAnimation) {
            const anim = this.state.animations[this.state.currentAnimation];
            document.getElementById('animationConfig').style.display = 'block';
            document.getElementById('animationName').value = anim.name;
            document.getElementById('animationFPS').value = anim.fps;
            document.getElementById('animationLoop').checked = anim.loop;
            this.updateFrameList();
        } else {
            document.getElementById('animationConfig').style.display = 'none';
            document.getElementById('frameListContainer').innerHTML = '<div class="empty-state">Select an animation</div>';
        }
    }

    updateFrameList() {
        const container = document.getElementById('frameListContainer');

        if (!this.state.currentAnimation) {
            container.innerHTML = '<div class="empty-state">Select an animation</div>';
            return;
        }

        const anim = this.state.animations[this.state.currentAnimation];

        if (anim.frames.length === 0) {
            container.innerHTML = '<div class="empty-state">No frames yet<br>Click on sprite sheet to add frames</div>';
            return;
        }

        container.innerHTML = '<div class="frame-list" id="frameList"></div>';
        const frameList = document.getElementById('frameList');

        anim.frames.forEach((frame, index) => {
            const frameDiv = document.createElement('div');
            frameDiv.className = 'frame-item' + (index === this.state.selectedFrameIndex ? ' selected' : '');
            frameDiv.draggable = true;
            frameDiv.dataset.index = index;

            // Click to select frame
            frameDiv.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                    return;
                }
                this.selectFrame(index);
            });

            // Thumbnail
            const canvas = document.createElement('canvas');
            canvas.className = 'frame-thumbnail';
            canvas.width = 48;
            canvas.height = 48;
            const ctx = canvas.getContext('2d');
            if (this.state.spriteLoaded) {
                const scale = Math.min(48 / frame.width, 48 / frame.height);
                const w = frame.width * scale;
                const h = frame.height * scale;
                ctx.drawImage(this.state.spriteImage,
                    frame.x, frame.y, frame.width, frame.height,
                    (48 - w) / 2, (48 - h) / 2, w, h);
            }

            // Info
            const info = document.createElement('div');
            info.className = 'frame-info';
            info.innerHTML = `Frame ${index + 1}<br>${frame.width}×${frame.height} at (${frame.x}, ${frame.y})`;

            // Duration input
            const durationInput = document.createElement('input');
            durationInput.type = 'number';
            durationInput.className = 'frame-duration';
            durationInput.value = frame.duration;
            durationInput.min = '10';
            durationInput.step = '10';
            durationInput.onchange = () => this.updateFrameDuration(index, durationInput.value);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'frame-delete';
            deleteBtn.textContent = 'Del';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteFrame(index);
            };

            frameDiv.appendChild(canvas);
            frameDiv.appendChild(info);
            frameDiv.appendChild(durationInput);
            frameDiv.appendChild(deleteBtn);

            // Drag and drop
            frameDiv.addEventListener('dragstart', (e) => {
                this.state.draggedFrame = index;
                frameDiv.classList.add('dragging');
            });

            frameDiv.addEventListener('dragend', () => {
                frameDiv.classList.remove('dragging');
            });

            frameDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            frameDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.state.draggedFrame !== null && this.state.draggedFrame !== index) {
                    this.moveFrame(this.state.draggedFrame, index);
                }
            });

            frameList.appendChild(frameDiv);
        });
    }

    // Preview animation
    startPreviewLoop() {
        const animate = (timestamp) => {
            const deltaTime = timestamp - this.previewState.lastTimestamp;
            this.previewState.lastTimestamp = timestamp;

            this.drawPreview(deltaTime);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    drawPreview(deltaTime) {
        // Clear canvas
        this.previewCtx.fillStyle = '#000';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        if (!this.state.currentAnimation || !this.state.spriteLoaded || !this.animator) {
            return;
        }

        const anim = this.state.animations[this.state.currentAnimation];
        if (!anim || anim.frames.length === 0) return;

        // Update animator
        this.animator.update(deltaTime);

        // Get current frame info from animator
        const currentFrameIndex = this.animator.getCurrentFrame();
        const frame = anim.frames[currentFrameIndex];

        // Calculate centered and scaled position
        const scale = Math.min(
            this.previewCanvas.width / frame.width,
            this.previewCanvas.height / frame.height,
            2 // Max scale
        );
        const w = frame.width * scale;
        const h = frame.height * scale;
        const x = (this.previewCanvas.width - w) / 2;
        const y = (this.previewCanvas.height - h) / 2;

        // Draw using animator
        this.animator.draw(this.previewCtx, x, y, w, h);

        // Update play state from animator
        if (!this.animator.isAnimationPlaying() && this.previewState.isPlaying) {
            this.previewState.isPlaying = false;
            this.updatePlayPauseButton();
        }

        // Update info
        const playStatus = this.previewState.isPlaying ? 'Playing' : 'Paused';
        document.getElementById('previewInfo').textContent =
            `Frame ${currentFrameIndex + 1}/${anim.frames.length} | ${anim.fps} FPS | ${anim.loop ? 'Loop' : 'Once'} | ${playStatus}`;
    }

    // Preview controls
    reloadPreview() {
        this.resetPreviewState();
        this.previewState.isPlaying = true;
        if (this.animator && this.state.currentAnimation) {
            this.animator.play(this.state.currentAnimation, true);
        }
        this.updatePlayPauseButton();
    }

    togglePlayPreview() {
        this.previewState.isPlaying = !this.previewState.isPlaying;
        if (this.animator) {
            if (this.previewState.isPlaying) {
                this.animator.resume();
            } else {
                this.animator.pause();
            }
        }
        this.updatePlayPauseButton();
    }

    stopPreview() {
        this.resetPreviewState();
        this.previewState.isPlaying = false;
        if (this.animator) {
            this.animator.stop();
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        btn.textContent = this.previewState.isPlaying ? 'Pause' : 'Play';
    }

    // Import/Export
    exportToJSON() {
        const data = {
            animations: this.state.animations,
            spriteSheet: this.state.spriteImage ? this.state.spriteImage.src : null
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animations.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importFromJSON() {
        document.getElementById('jsonFileInput').click();
    }

    handleJSONFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.state.animations = data.animations || {};

                if (data.spriteSheet) {
                    this.loadSpriteImage(data.spriteSheet);
                }

                this.state.currentAnimation = null;
                this.updateUI();
                this.drawSpriteCanvas();
                this.saveToLocalStorage();
            } catch (err) {
                alert('Failed to parse JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // LocalStorage
    saveToLocalStorage() {
        const data = {
            animations: this.state.animations,
            spriteSheet: this.state.spriteImage ? this.state.spriteImage.src : null
        };
        localStorage.setItem('spriteAnimatorData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('spriteAnimatorData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.state.animations = parsed.animations || {};
                if (parsed.spriteSheet) {
                    this.loadSpriteImage(parsed.spriteSheet);
                }
            } catch (err) {
                console.error('Failed to load from localStorage:', err);
            }
        }
    }
}

export { Editor };
