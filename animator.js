/**
 * SpriteSheetAnimator - A class for managing sprite sheet animations
 */
class SpriteSheetAnimator {
    /**
     * @param {string} imagePath - Path to the sprite sheet image
     * @param {Object} options - Configuration options
     * @param {number} options.frameWidth - Width of each frame
     * @param {number} options.frameHeight - Height of each frame
     * @param {number} options.offsetX - X offset to start of sprite grid (default: 0)
     * @param {number} options.offsetY - Y offset to start of sprite grid (default: 0)
     */
    constructor(imagePath, options = {}) {
        this.image = new Image();
        this.imagePath = imagePath;
        this.frameWidth = options.frameWidth || 64;
        this.frameHeight = options.frameHeight || 64;
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;

        // Animation state
        this.animations = {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.isPlaying = false;
        this.loop = true;
        this.onComplete = null;

        // Image loading
        this.loaded = false;
        this.loadPromise = new Promise((resolve, reject) => {
            this.image.onload = () => {
                this.loaded = true;
                resolve(this);
            };
            this.image.onerror = () => {
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
        });

        this.image.src = imagePath;
    }

    /**
     * Wait for the sprite sheet to load
     * @returns {Promise<SpriteSheetAnimator>}
     */
    async waitForLoad() {
        return this.loadPromise;
    }

    /**
     * Add an animation definition
     * @param {string} name - Name of the animation
     * @param {Object} config - Animation configuration
     * @param {Array<Object>} config.frames - Array of frame definitions
     * @param {number} config.frames[].x - X position in sprite sheet
     * @param {number} config.frames[].y - Y position in sprite sheet
     * @param {number} config.frames[].width - Frame width (optional, uses default)
     * @param {number} config.frames[].height - Frame height (optional, uses default)
     * @param {number} config.frameRate - Frames per second (default: 10)
     * @param {boolean} config.loop - Whether to loop the animation (default: true)
     */
    addAnimation(name, config) {
        this.animations[name] = {
            frames: config.frames || [],
            frameRate: config.frameRate || 10,
            loop: config.loop !== undefined ? config.loop : true,
            frameDuration: 1000 / (config.frameRate || 10)
        };
    }

    /**
     * Add an animation using a grid-based approach
     * @param {string} name - Name of the animation
     * @param {Object} config - Animation configuration
     * @param {number} config.row - Row in the sprite sheet (0-based)
     * @param {number} config.startCol - Starting column (0-based)
     * @param {number} config.frameCount - Number of frames
     * @param {number} config.frameRate - Frames per second (default: 10)
     * @param {boolean} config.loop - Whether to loop (default: true)
     */
    addAnimationFromGrid(name, config) {
        const frames = [];
        for (let i = 0; i < config.frameCount; i++) {
            frames.push({
                x: this.offsetX + (config.startCol + i) * this.frameWidth,
                y: this.offsetY + config.row * this.frameHeight,
                width: this.frameWidth,
                height: this.frameHeight
            });
        }

        this.addAnimation(name, {
            frames: frames,
            frameRate: config.frameRate || 10,
            loop: config.loop !== undefined ? config.loop : true
        });
    }

    /**
     * Play an animation
     * @param {string} name - Name of the animation to play
     * @param {boolean} restart - Force restart if already playing (default: false)
     */
    play(name, restart = false) {
        if (!this.animations[name]) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        if (this.currentAnimation !== name || restart) {
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.frameTime = 0;
        }

        this.loop = this.animations[name].loop;
        this.isPlaying = true;
    }

    /**
     * Pause the current animation
     */
    pause() {
        this.isPlaying = false;
    }

    /**
     * Resume the current animation
     */
    resume() {
        this.isPlaying = true;
    }

    /**
     * Stop the animation and reset to first frame
     */
    stop() {
        this.isPlaying = false;
        this.currentFrame = 0;
        this.frameTime = 0;
    }

    /**
     * Update the animation state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        if (!this.isPlaying || !this.currentAnimation) {
            return;
        }

        const animation = this.animations[this.currentAnimation];
        if (!animation || animation.frames.length === 0) {
            return;
        }

        this.frameTime += deltaTime;

        if (this.frameTime >= animation.frameDuration) {
            this.frameTime -= animation.frameDuration;
            this.currentFrame++;

            if (this.currentFrame >= animation.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = animation.frames.length - 1;
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }
        }
    }

    /**
     * Draw the current frame to a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {number} x - X position to draw at
     * @param {number} y - Y position to draw at
     * @param {number} width - Width to draw (optional, uses frame width)
     * @param {number} height - Height to draw (optional, uses frame height)
     */
    draw(ctx, x, y, width, height) {
        if (!this.loaded || !this.currentAnimation) {
            return;
        }

        const animation = this.animations[this.currentAnimation];
        if (!animation || animation.frames.length === 0) {
            return;
        }

        const frame = animation.frames[this.currentFrame];
        const drawWidth = width || frame.width || this.frameWidth;
        const drawHeight = height || frame.height || this.frameHeight;

        ctx.drawImage(
            this.image,
            frame.x,
            frame.y,
            frame.width || this.frameWidth,
            frame.height || this.frameHeight,
            x,
            y,
            drawWidth,
            drawHeight
        );
    }

    /**
     * Get the current animation name
     * @returns {string|null}
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    /**
     * Get the current frame index
     * @returns {number}
     */
    getCurrentFrame() {
        return this.currentFrame;
    }

    /**
     * Check if an animation is currently playing
     * @returns {boolean}
     */
    isAnimationPlaying() {
        return this.isPlaying;
    }

    /**
     * Set a callback for when a non-looping animation completes
     * @param {Function} callback
     */
    setOnComplete(callback) {
        this.onComplete = callback;
    }
}
