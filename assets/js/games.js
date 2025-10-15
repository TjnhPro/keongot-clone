// Thu Gian Games - PREMIUM INTERACTIVE FEATURES
console.log('Thu Gian Games loaded!');

// Game State Management
class GameState {
    constructor() {
        this.storageKey = 'keongot_games_progress';
        this.initData();
    }

    initData() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultData = {
                coloringDrawings: [],
                memoryBestScore: 0,
                puzzleBestTime: 0,
                mathBestScore: 0,
                pianoRecordings: [],
                totalPlayTime: 0,
                achievements: []
            };
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    updateData(updates) {
        const data = this.getData();
        const newData = { ...data, ...updates };
        localStorage.setItem(this.storageKey, JSON.stringify(newData));
    }

    addAchievement(achievement) {
        const data = this.getData();
        if (!data.achievements.includes(achievement)) {
            this.updateData({
                achievements: [...data.achievements, achievement]
            });
            this.showAchievement(achievement);
        }
    }

    showAchievement(achievement) {
        const achievementModal = document.createElement('div');
        achievementModal.className = 'achievement-modal';
        achievementModal.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">🏆</div>
                <h3>Thành tích mới!</h3>
                <p>${achievement}</p>
            </div>
        `;
        document.body.appendChild(achievementModal);
        
        setTimeout(() => {
            achievementModal.remove();
        }, 3000);
    }
}

// Initialize game state
const gameState = new GameState();

// Coloring Game
class ColoringGame {
    constructor() {
        this.canvas = document.getElementById('coloringCanvas');
        this.ctx = this.canvas.getContext('2d');
        // track device pixel ratio and css sizing to avoid mis-scaling
        this.dpr = window.devicePixelRatio || 1;
        this.cssWidth = this.canvas.width;   // initial CSS pixels from HTML attribute
        this.cssHeight = this.canvas.height; // initial CSS pixels from HTML attribute
        this.isDrawing = false;
        this.currentColor = '#FF6B9D';
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.colors = [
            '#FF6B9D', '#4ECDC4', '#FFD93D', '#FF8C42', '#9B59B6',
            '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#34495E',
            '#E67E22', '#1ABC9C', '#8E44AD', '#F1C40F', '#E91E63'
        ];
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupColorPalette();
        this.setupTools();
        this.setupImageSelector();
        this.loadExternalTemplates();
        this.loadImage('dolphin'); // Load default image
    }

    setupCanvas() {
        // HiDPI scaling for sharper lines while keeping coordinate system in CSS pixels
        const dpr = this.dpr;
        const cssW = this.cssWidth;
        const cssH = this.cssHeight;
        this.canvas.style.width = cssW + 'px';
        this.canvas.style.height = cssH + 'px';
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = 'white';
        // Use CSS pixel coordinates for drawing thanks to transform above
        this.ctx.fillRect(0, 0, cssW, cssH);

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    setupColorPalette() {
        const palette = document.getElementById('colorPalette');
        palette.innerHTML = '';

        this.colors.forEach((color, index) => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.dataset.color = color;
            if (index === 0) colorBtn.classList.add('active');
            
            colorBtn.addEventListener('click', () => this.selectColor(color, colorBtn));
            palette.appendChild(colorBtn);
        });
    }

    setupTools() {
        const tools = ['brushTool', 'eraserTool', 'clearTool', 'saveTool'];
        tools.forEach(toolId => {
            const tool = document.getElementById(toolId);
            if (tool) {
                tool.addEventListener('click', () => this.selectTool(toolId, tool));
            }
        });
    }

    setupImageSelector() {
        document.querySelectorAll('.image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Button clicked:', btn.textContent, 'Auto-generate:', btn.classList.contains('auto-generate'));
                if (btn.classList.contains('auto-generate')) {
                    console.log('Generating random drawing...');
                    this.generateRandomDrawing();
                } else {
                    this.selectImage(e.target.dataset.image, e.target);
                }
            });
        });
    }

    // Load extra template buttons from manifest so teachers can add more easily
    async loadExternalTemplates() {
        try {
            const res = await fetch('assets/drawings/manifest.json', { cache: 'no-cache' });
            if (!res.ok) return; // optional file
            const manifest = await res.json();
            if (!Array.isArray(manifest)) return;
            const container = document.getElementById('imageOptions');
            const existing = new Set(Array.from(container.querySelectorAll('.image-btn')).map(b => b.dataset.image));
            manifest.forEach(item => {
                if (!item || !item.id || existing.has(item.id)) return;
                const btn = document.createElement('button');
                btn.className = 'image-btn';
                btn.dataset.image = item.id;
                btn.textContent = `${item.emoji ? item.emoji + ' ' : ''}${item.title || item.id}`;
                btn.addEventListener('click', (e) => {
                    this.selectImage(item.id, btn);
                });
                // insert before the auto-generate button if present
                const autoBtn = container.querySelector('.auto-generate');
                if (autoBtn) container.insertBefore(btn, autoBtn); else container.appendChild(btn);
            });
        } catch (e) {
            // silent: manifest is optional
        }
    }

    selectImage(imageType, button) {
        document.querySelectorAll('.image-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.animateButton(button);
        this.loadImage(imageType);
    }

    // Generate random drawing
    generateRandomDrawing() {
        console.log('Generating completely new random drawing...');
        
        // Clear canvas completely first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset drawing state
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Always use AI generation
        this.generateDALLEMiniImage();
        
        // Remove active state from all buttons
        document.querySelectorAll('.image-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // Generate DALL-E Mini image
    async generateDALLEMiniImage() {
        // Use local generation instead of AI for better quality
        console.log('Using local generation for better coloring book quality');
        this.drawSimpleColoringShapes();
        this.showMessage('Đã tạo tranh mới! Hãy tô màu thôi!', 'success');
    }

    // Draw simple coloring book shapes
    drawSimpleColoringShapes() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Set thick black outline for coloring book style
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'transparent';
        
        // Choose a simple shape to draw
        const shapes = ['house', 'flower', 'butterfly', 'tree', 'car', 'cat', 'sun', 'heart', 'fish', 'bird', 'star', 'balloon', 'moon', 'cloud', 'mountain', 'river', 'bridge', 'lighthouse', 'windmill', 'tent', 'camera', 'book', 'pencil', 'candy', 'cake', 'pizza', 'icecream', 'cupcake', 'cookie', 'donut', 'hamburger', 'frenchfries', 'soda', 'coffee', 'tea', 'bottle', 'plate', 'fork', 'spoon', 'knife'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        console.log('Drawing simple shape:', randomShape);
        
        // Draw the selected shape
        this.drawColoringBookShape(ctx, centerX, centerY, randomShape);
        
        // Add some decorative elements
        this.addDecorativeElements(ctx, canvas);
    }

    // Add decorative elements to make the drawing more interesting
    addDecorativeElements(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Add some random decorative elements
        const decorations = ['cloud', 'star', 'heart', 'flower'];
        const numDecorations = Math.floor(Math.random() * 3) + 2; // 2-4 decorations
        
        for (let i = 0; i < numDecorations; i++) {
            const decoration = decorations[Math.floor(Math.random() * decorations.length)];
            const x = Math.random() * (width - 100) + 50;
            const y = Math.random() * (height - 100) + 50;
            const size = Math.random() * 30 + 20; // 20-50px
            
            this.drawSmallDecoration(ctx, x, y, size, decoration);
        }
        
        // Add border decoration
        this.drawBorderDecoration(ctx, width, height);
    }

    // Draw small decorative elements
    drawSmallDecoration(ctx, x, y, size, type) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'transparent';
        
        switch(type) {
            case 'cloud':
                this.drawSmallCloud(ctx, x, y, size);
                break;
            case 'star':
                this.drawSmallStar(ctx, x, y, size);
                break;
            case 'heart':
                this.drawSmallHeart(ctx, x, y, size);
                break;
            case 'flower':
                this.drawSmallFlower(ctx, x, y, size);
                break;
        }
    }

    // Draw small cloud
    drawSmallCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size/3, 0, Math.PI * 2);
        ctx.arc(x + size/3, y, size/2, 0, Math.PI * 2);
        ctx.arc(x + size/2, y, size/3, 0, Math.PI * 2);
        ctx.arc(x + size/6, y - size/4, size/3, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw small star
    drawSmallStar(ctx, x, y, size) {
        const spikes = 5;
        const outerRadius = size/2;
        const innerRadius = size/4;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Draw small heart
    drawSmallHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/4);
        ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
        ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size, x, y + size);
        ctx.bezierCurveTo(x, y + size, x + size/2, y + size/2, x + size/2, y + size/4);
        ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
        ctx.stroke();
    }

    // Draw small flower
    drawSmallFlower(ctx, x, y, size) {
        // Stem
        ctx.beginPath();
        ctx.moveTo(x, y + size/2);
        ctx.lineTo(x, y - size/4);
        ctx.stroke();
        
        // Petals
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const px = x + Math.cos(angle) * size/4;
            const py = y - size/4 + Math.sin(angle) * size/4;
            
            ctx.beginPath();
            ctx.arc(px, py, size/8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Center
        ctx.beginPath();
        ctx.arc(x, y - size/4, size/12, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw border decoration
    drawBorderDecoration(ctx, width, height) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Draw a simple border
        ctx.beginPath();
        ctx.rect(10, 10, width - 20, height - 20);
        ctx.stroke();
        
        // Add corner decorations
        const cornerSize = 20;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(10, 10 + cornerSize);
        ctx.lineTo(10, 10);
        ctx.lineTo(10 + cornerSize, 10);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(width - 10 - cornerSize, 10);
        ctx.lineTo(width - 10, 10);
        ctx.lineTo(width - 10, 10 + cornerSize);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(10, height - 10 - cornerSize);
        ctx.lineTo(10, height - 10);
        ctx.lineTo(10 + cornerSize, height - 10);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(width - 10 - cornerSize, height - 10);
        ctx.lineTo(width - 10, height - 10);
        ctx.lineTo(width - 10, height - 10 - cornerSize);
        ctx.stroke();
    }

    drawColoringBookShape(ctx, x, y, shape) {
        const size = 120; // Large size for easy coloring
        
        switch(shape) {
            case 'house':
                this.drawColoringHouse(ctx, x, y, size);
                break;
            case 'flower':
                this.drawColoringFlower(ctx, x, y, size);
                break;
            case 'butterfly':
                this.drawColoringButterfly(ctx, x, y, size);
                break;
            case 'tree':
                this.drawColoringTree(ctx, x, y, size);
                break;
            case 'car':
                this.drawColoringCar(ctx, x, y, size);
                break;
            case 'cat':
                this.drawColoringCat(ctx, x, y, size);
                break;
            case 'sun':
                this.drawColoringSun(ctx, x, y, size);
                break;
            case 'heart':
                this.drawColoringHeart(ctx, x, y, size);
                break;
            case 'fish':
                this.drawColoringFish(ctx, x, y, size);
                break;
            case 'bird':
                this.drawColoringBird(ctx, x, y, size);
                break;
            case 'star':
                this.drawColoringStar(ctx, x, y, size);
                break;
            case 'balloon':
                this.drawColoringBalloon(ctx, x, y, size);
                break;
        }
    }

    drawColoringHouse(ctx, x, y, size) {
        // House base
        ctx.beginPath();
        ctx.rect(x - size/2, y - size/4, size, size/2);
        ctx.stroke();
        
        // Roof
        ctx.beginPath();
        ctx.moveTo(x - size/2, y - size/4);
        ctx.lineTo(x, y - size/2);
        ctx.lineTo(x + size/2, y - size/4);
        ctx.stroke();
        
        // Chimney
        ctx.beginPath();
        ctx.rect(x + size/4, y - size/2, size/8, size/4);
        ctx.stroke();
        
        // Door
        ctx.beginPath();
        ctx.rect(x - size/8, y - size/8, size/4, size/4);
        ctx.stroke();
        
        // Door handle
        ctx.beginPath();
        ctx.arc(x + size/16, y - size/16, size/32, 0, Math.PI * 2);
        ctx.stroke();
        
        // Windows
        ctx.beginPath();
        ctx.rect(x - size/3, y - size/6, size/6, size/6);
        ctx.stroke();
        // Window cross
        ctx.beginPath();
        ctx.moveTo(x - size/3, y - size/8);
        ctx.lineTo(x - size/6, y - size/8);
        ctx.moveTo(x - size/4, y - size/6);
        ctx.lineTo(x - size/4, y - size/12);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.rect(x + size/6, y - size/6, size/6, size/6);
        ctx.stroke();
        // Window cross
        ctx.beginPath();
        ctx.moveTo(x + size/6, y - size/8);
        ctx.lineTo(x + size/3, y - size/8);
        ctx.moveTo(x + size/4, y - size/6);
        ctx.lineTo(x + size/4, y - size/12);
        ctx.stroke();
        
        // Ground line
        ctx.beginPath();
        ctx.moveTo(x - size, y + size/4);
        ctx.lineTo(x + size, y + size/4);
        ctx.stroke();
    }

    drawColoringFlower(ctx, x, y, size) {
        // Stem
        ctx.beginPath();
        ctx.moveTo(x, y + size/2);
        ctx.lineTo(x, y - size/4);
        ctx.stroke();
        
        // Leaves
        ctx.beginPath();
        ctx.ellipse(x - size/8, y + size/8, size/12, size/6, -Math.PI/4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x + size/8, y - size/8, size/12, size/6, Math.PI/4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Petals
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const px = x + Math.cos(angle) * size/3;
            const py = y - size/4 + Math.sin(angle) * size/3;
            
            ctx.beginPath();
            ctx.ellipse(px, py, size/6, size/8, angle, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Center
        ctx.beginPath();
        ctx.arc(x, y - size/4, size/8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center dots
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const px = x + Math.cos(angle) * size/16;
            const py = y - size/4 + Math.sin(angle) * size/16;
            
            ctx.beginPath();
            ctx.arc(px, py, size/32, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawColoringButterfly(ctx, x, y, size) {
        // Body
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x, y + size/2);
        ctx.stroke();
        
        // Upper wings
        ctx.beginPath();
        ctx.ellipse(x - size/3, y - size/4, size/3, size/4, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + size/3, y - size/4, size/3, size/4, 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Lower wings
        ctx.beginPath();
        ctx.ellipse(x - size/4, y + size/8, size/4, size/3, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + size/4, y + size/8, size/4, size/3, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Antennae
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x - size/8, y - size/2 - size/8);
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/8, y - size/2 - size/8);
        ctx.stroke();
    }

    drawColoringTree(ctx, x, y, size) {
        // Trunk
        ctx.beginPath();
        ctx.rect(x - size/12, y - size/4, size/6, size/2);
        ctx.stroke();
        
        // Leaves
        ctx.beginPath();
        ctx.arc(x, y - size/2, size/3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawColoringCar(ctx, x, y, size) {
        // Car body
        ctx.beginPath();
        ctx.rect(x - size/2, y - size/6, size, size/3);
        ctx.stroke();
        
        // Wheels
        ctx.beginPath();
        ctx.arc(x - size/3, y + size/6, size/8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size/3, y + size/6, size/8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Windows
        ctx.beginPath();
        ctx.rect(x - size/4, y - size/8, size/4, size/8);
        ctx.stroke();
    }

    drawColoringCat(ctx, x, y, size) {
        // Head
        ctx.beginPath();
        ctx.arc(x, y - size/4, size/3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(x - size/4, y - size/2);
        ctx.lineTo(x - size/6, y - size/3);
        ctx.lineTo(x - size/8, y - size/2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size/4, y - size/2);
        ctx.lineTo(x + size/6, y - size/3);
        ctx.lineTo(x + size/8, y - size/2);
        ctx.stroke();
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y + size/8, size/3, size/4, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(x + size/3, y + size/8);
        ctx.quadraticCurveTo(x + size/2, y + size/4, x + size/4, y + size/2);
        ctx.stroke();
    }

    drawColoringSun(ctx, x, y, size) {
        // Sun circle
        ctx.beginPath();
        ctx.arc(x, y, size/3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sun rays
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * size/3, y + Math.sin(angle) * size/3);
            ctx.lineTo(x + Math.cos(angle) * size/2, y + Math.sin(angle) * size/2);
            ctx.stroke();
        }
    }

    drawColoringHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/4);
        ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
        ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size/2, x, y + size);
        ctx.bezierCurveTo(x, y + size/2, x + size/2, y + size/2, x + size/2, y + size/4);
        ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
        ctx.stroke();
    }

    drawColoringFish(ctx, x, y, size) {
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, size/3, size/4, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(x - size/3, y);
        ctx.lineTo(x - size/2, y - size/4);
        ctx.lineTo(x - size/2, y + size/4);
        ctx.closePath();
        ctx.stroke();
        
        // Eye
        ctx.beginPath();
        ctx.arc(x + size/6, y - size/8, size/12, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawColoringBird(ctx, x, y, size) {
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, size/4, size/3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Head
        ctx.beginPath();
        ctx.arc(x + size/6, y - size/6, size/6, 0, Math.PI * 2);
        ctx.stroke();
        
        // Beak
        ctx.beginPath();
        ctx.moveTo(x + size/3, y - size/6);
        ctx.lineTo(x + size/2, y - size/8);
        ctx.lineTo(x + size/3, y - size/4);
        ctx.stroke();
        
        // Wings
        ctx.beginPath();
        ctx.ellipse(x - size/8, y - size/8, size/4, size/6, -0.3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawColoringStar(ctx, x, y, size) {
        const points = 5;
        const outerRadius = size/3;
        const innerRadius = size/6;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    drawColoringBalloon(ctx, x, y, size) {
        // Balloon
        ctx.beginPath();
        ctx.ellipse(x, y - size/4, size/4, size/3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // String
        ctx.beginPath();
        ctx.moveTo(x, y - size/4 + size/3);
        ctx.lineTo(x, y + size/2);
        ctx.stroke();
    }

    // Draw completely random shapes and patterns
    drawRandomShape() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Get actual canvas dimensions (accounting for device pixel ratio)
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        console.log('Canvas dimensions:', rect.width, 'x', rect.height);
        console.log('Center point:', centerX, centerY);
        
        // Set random colors for outline
        const colors = ['#FF6B9D', '#4ECDC4', '#45B7B8', '#FF8C42', '#FFD93D', '#FF6B6B', '#9B59B6', '#E74C3C', '#2ECC71', '#F39C12'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.strokeStyle = randomColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        console.log('Drawing with color:', randomColor);
        
        // Generate completely unique random drawing
        this.drawUniqueRandomArt(centerX, centerY);
        
        console.log('Random drawing completed');
    }

    // Create completely unique random art
    drawUniqueRandomArt(centerX, centerY) {
        const ctx = this.ctx;
        const patterns = ['abstract', 'nature', 'geometric', 'organic', 'fantasy', 'space', 'underwater', 'city'];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        switch(randomPattern) {
            case 'abstract':
                this.drawAbstractArt(centerX, centerY);
                break;
            case 'nature':
                this.drawNatureScene(centerX, centerY);
                break;
            case 'geometric':
                this.drawGeometricPattern(centerX, centerY);
                break;
            case 'organic':
                this.drawOrganicShapes(centerX, centerY);
                break;
            case 'fantasy':
                this.drawFantasyCreature(centerX, centerY);
                break;
            case 'space':
                this.drawSpaceScene(centerX, centerY);
                break;
            case 'underwater':
                this.drawUnderwaterScene(centerX, centerY);
                break;
            case 'city':
                this.drawCityscape(centerX, centerY);
                break;
        }
    }

    drawAbstractArt(centerX, centerY) {
        const ctx = this.ctx;
        const numShapes = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numShapes; i++) {
            const x = centerX + (Math.random() - 0.5) * 300;
            const y = centerY + (Math.random() - 0.5) * 300;
            const size = 30 + Math.random() * 80;
            
            ctx.beginPath();
            for (let j = 0; j < 8; j++) {
                const angle = (j * Math.PI * 2) / 8;
                const radius = size * (0.5 + Math.random() * 0.5);
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                if (j === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        // Add flowing lines
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 200);
            for (let j = 0; j < 10; j++) {
                const x = centerX + (Math.random() - 0.5) * 300;
                const y = centerY + (Math.random() - 0.5) * 300;
                ctx.quadraticCurveTo(x, y, x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
            }
            ctx.stroke();
        }
    }

    drawNatureScene(centerX, centerY) {
        const ctx = this.ctx;
        
        // Draw mountains
        ctx.beginPath();
        ctx.moveTo(50, centerY + 100);
        for (let i = 0; i < 5; i++) {
            const x = 50 + i * 80;
            const y = centerY + 50 - Math.random() * 100;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(450, centerY + 100);
        ctx.stroke();
        
        // Draw trees
        for (let i = 0; i < 4; i++) {
            const x = 100 + i * 100;
            const y = centerY + 80;
            this.drawTree(ctx, x, y, 40 + Math.random() * 30);
        }
        
        // Draw clouds
        for (let i = 0; i < 3; i++) {
            const x = 80 + i * 120;
            const y = centerY - 50;
            this.drawCloud(ctx, x, y, 30 + Math.random() * 20);
        }
        
        // Draw sun
        this.drawSun(ctx, 400, centerY - 80, 25);
    }

    drawTree(ctx, x, y, height) {
        // Trunk
        ctx.beginPath();
        ctx.rect(x - 5, y, 10, height);
        ctx.stroke();
        
        // Leaves
        ctx.beginPath();
        ctx.arc(x, y - 10, height * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSun(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sun rays
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            ctx.lineTo(x + Math.cos(angle) * (size + 15), y + Math.sin(angle) * (size + 15));
            ctx.stroke();
        }
    }

    drawGeometricPattern(centerX, centerY) {
        const ctx = this.ctx;
        const shapes = ['hexagon', 'octagon', 'diamond', 'star', 'spiral'];
        
        for (let i = 0; i < 6; i++) {
            const x = centerX + (Math.random() - 0.5) * 250;
            const y = centerY + (Math.random() - 0.5) * 250;
            const size = 20 + Math.random() * 60;
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            this.drawGeometricShape(ctx, x, y, size, shape);
        }
    }

    drawGeometricShape(ctx, x, y, size, shape) {
        ctx.beginPath();
        
        switch(shape) {
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const px = x + Math.cos(angle) * size;
                    const py = y + Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                break;
            case 'octagon':
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const px = x + Math.cos(angle) * size;
                    const py = y + Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                break;
            case 'diamond':
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size, y);
                break;
            case 'star':
                this.drawStar(ctx, x, y, 5, size, size * 0.5);
                break;
            case 'spiral':
                for (let i = 0; i < 50; i++) {
                    const angle = i * 0.2;
                    const radius = i * 0.8;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                break;
        }
        
        ctx.closePath();
        ctx.stroke();
    }

    drawOrganicShapes(centerX, centerY) {
        const ctx = this.ctx;
        
        for (let i = 0; i < 4; i++) {
            const x = centerX + (Math.random() - 0.5) * 200;
            const y = centerY + (Math.random() - 0.5) * 200;
            const size = 40 + Math.random() * 60;
            
            // Draw organic blob
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let j = 0; j < 12; j++) {
                const angle = (j * Math.PI * 2) / 12;
                const radius = size * (0.7 + Math.random() * 0.6);
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                ctx.quadraticCurveTo(px + (Math.random() - 0.5) * 20, py + (Math.random() - 0.5) * 20, px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    drawFantasyCreature(centerX, centerY) {
        const ctx = this.ctx;
        
        // Draw dragon-like creature
        const x = centerX;
        const y = centerY;
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, 60, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Head
        ctx.beginPath();
        ctx.ellipse(x + 50, y - 20, 25, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Wings
        ctx.beginPath();
        ctx.ellipse(x - 30, y - 40, 40, 20, -0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 30, y - 40, 40, 20, 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(x - 60, y);
        ctx.quadraticCurveTo(x - 100, y - 30, x - 120, y + 10);
        ctx.stroke();
        
        // Eyes
        ctx.beginPath();
        ctx.arc(x + 60, y - 25, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSpaceScene(centerX, centerY) {
        const ctx = this.ctx;
        
        // Draw planet
        ctx.beginPath();
        ctx.arc(centerX - 100, centerY, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw stars
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 500;
            const y = Math.random() * 500;
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw rocket
        ctx.beginPath();
        ctx.moveTo(centerX + 50, centerY + 50);
        ctx.lineTo(centerX + 30, centerY + 20);
        ctx.lineTo(centerX + 70, centerY + 20);
        ctx.closePath();
        ctx.stroke();
        
        // Draw UFO
        ctx.beginPath();
        ctx.ellipse(centerX + 100, centerY - 50, 30, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX + 100, centerY - 50, 20, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawUnderwaterScene(centerX, centerY) {
        const ctx = this.ctx;
        
        // Draw fish
        for (let i = 0; i < 5; i++) {
            const x = centerX + (Math.random() - 0.5) * 300;
            const y = centerY + (Math.random() - 0.5) * 200;
            this.drawFish(ctx, x, y, 20 + Math.random() * 30);
        }
        
        // Draw seaweed
        for (let i = 0; i < 6; i++) {
            const x = 50 + i * 80;
            const y = centerY + 100;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 10, y - 60, x, y - 120);
            ctx.stroke();
        }
        
        // Draw bubbles
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 500;
            const y = Math.random() * 500;
            ctx.beginPath();
            ctx.arc(x, y, 3 + Math.random() * 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawCityscape(centerX, centerY) {
        const ctx = this.ctx;
        
        // Draw buildings
        for (let i = 0; i < 8; i++) {
            const x = 50 + i * 60;
            const height = 80 + Math.random() * 120;
            const y = centerY + 100 - height;
            
            ctx.beginPath();
            ctx.rect(x, y, 50, height);
            ctx.stroke();
            
            // Draw windows
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 2; k++) {
                    if (Math.random() > 0.3) {
                        ctx.beginPath();
                        ctx.rect(x + 10 + k * 15, y + 20 + j * 20, 8, 8);
                        ctx.stroke();
                    }
                }
            }
        }
        
        // Draw road
        ctx.beginPath();
        ctx.moveTo(0, centerY + 100);
        ctx.lineTo(500, centerY + 100);
        ctx.stroke();
        
        // Draw cars
        for (let i = 0; i < 3; i++) {
            const x = 100 + i * 150;
            const y = centerY + 90;
            ctx.beginPath();
            ctx.rect(x, y, 30, 15);
            ctx.stroke();
        }
    }

    drawRandomElement(centerX, centerY, index) {
        const ctx = this.ctx;
        const shapes = ['circle', 'star', 'heart', 'triangle', 'square', 'flower', 'butterfly', 'fish'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        const size = 50 + Math.random() * 100;
        const x = centerX + (Math.random() - 0.5) * 200;
        const y = centerY + (Math.random() - 0.5) * 200;
        
        ctx.beginPath();
        
        switch(randomShape) {
            case 'circle':
                ctx.arc(x, y, size/2, 0, Math.PI * 2);
                break;
            case 'star':
                this.drawStar(ctx, x, y, 5, size/2, size/4);
                break;
            case 'heart':
                this.drawHeart(ctx, x, y, size);
                break;
            case 'triangle':
                this.drawTriangle(ctx, x, y, size);
                break;
            case 'square':
                ctx.rect(x - size/2, y - size/2, size, size);
                break;
            case 'flower':
                this.drawFlower(ctx, x, y, size);
                break;
            case 'butterfly':
                this.drawButterfly(ctx, x, y, size);
                break;
            case 'fish':
                this.drawFish(ctx, x, y, size);
                break;
        }
        
        ctx.stroke();
    }

    drawStar(ctx, x, y, points, outerRadius, innerRadius) {
        const angle = Math.PI / points;
        ctx.beginPath();
        for (let i = 0; i < 2 * points; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle2 = i * angle;
            const x2 = x + Math.cos(angle2) * radius;
            const y2 = y + Math.sin(angle2) * radius;
            if (i === 0) {
                ctx.moveTo(x2, y2);
            } else {
                ctx.lineTo(x2, y2);
            }
        }
        ctx.closePath();
    }

    drawHeart(ctx, x, y, size) {
        const width = size;
        const height = size;
        ctx.beginPath();
        ctx.moveTo(x, y + height/4);
        ctx.bezierCurveTo(x, y, x - width/2, y, x - width/2, y + height/4);
        ctx.bezierCurveTo(x - width/2, y + height/2, x, y + height/2, x, y + height);
        ctx.bezierCurveTo(x, y + height/2, x + width/2, y + height/2, x + width/2, y + height/4);
        ctx.bezierCurveTo(x + width/2, y, x, y, x, y + height/4);
        ctx.closePath();
    }

    drawTriangle(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.lineTo(x + size/2, y + size/2);
        ctx.closePath();
    }

    drawFlower(ctx, x, y, size) {
        const petals = 6;
        const petalLength = size/2;
        const petalWidth = size/4;
        
        for (let i = 0; i < petals; i++) {
            const angle = (i * 2 * Math.PI) / petals;
            const x1 = x + Math.cos(angle) * petalLength;
            const y1 = y + Math.sin(angle) * petalLength;
            const x2 = x + Math.cos(angle + 0.3) * petalWidth;
            const y2 = y + Math.sin(angle + 0.3) * petalWidth;
            const x3 = x + Math.cos(angle - 0.3) * petalWidth;
            const y3 = y + Math.sin(angle - 0.3) * petalWidth;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.stroke();
        }
        
        // Center circle
        ctx.beginPath();
        ctx.arc(x, y, size/8, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawButterfly(ctx, x, y, size) {
        const wingSize = size/2;
        
        // Left wing
        ctx.beginPath();
        ctx.ellipse(x - wingSize/2, y - wingSize/2, wingSize/2, wingSize/3, -0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Right wing
        ctx.beginPath();
        ctx.ellipse(x + wingSize/2, y - wingSize/2, wingSize/2, wingSize/3, 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Body
        ctx.beginPath();
        ctx.moveTo(x, y - wingSize);
        ctx.lineTo(x, y + wingSize);
        ctx.stroke();
        
        // Antennae
        ctx.beginPath();
        ctx.moveTo(x, y - wingSize);
        ctx.lineTo(x - 5, y - wingSize - 10);
        ctx.moveTo(x, y - wingSize);
        ctx.lineTo(x + 5, y - wingSize - 10);
        ctx.stroke();
    }

    drawFish(ctx, x, y, size) {
        const width = size;
        const height = size * 0.6;
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(x - width/2, y);
        ctx.lineTo(x - width/2 - 20, y - height/2);
        ctx.lineTo(x - width/2 - 20, y + height/2);
        ctx.closePath();
        ctx.stroke();
        
        // Eye
        ctx.beginPath();
        ctx.arc(x + width/4, y - height/4, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    addRandomDecorations(centerX, centerY) {
        const ctx = this.ctx;
        const decorations = ['dots', 'lines', 'curves', 'spirals'];
        const randomDeco = decorations[Math.floor(Math.random() * decorations.length)];
        
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 2;
        
        switch(randomDeco) {
            case 'dots':
                for (let i = 0; i < 10; i++) {
                    const x = centerX + (Math.random() - 0.5) * 300;
                    const y = centerY + (Math.random() - 0.5) * 300;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            case 'lines':
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 200);
                    ctx.lineTo(centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 200);
                    ctx.stroke();
                }
                break;
            case 'curves':
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 150);
                    ctx.quadraticCurveTo(
                        centerX + (Math.random() - 0.5) * 200, centerY + (Math.random() - 0.5) * 200,
                        centerX + (Math.random() - 0.5) * 150, centerY + (Math.random() - 0.5) * 150
                    );
                    ctx.stroke();
                }
                break;
            case 'spirals':
                for (let i = 0; i < 2; i++) {
                    const x = centerX + (Math.random() - 0.5) * 200;
                    const y = centerY + (Math.random() - 0.5) * 200;
                    ctx.beginPath();
                    for (let j = 0; j < 50; j++) {
                        const angle = j * 0.2;
                        const radius = j * 0.5;
                        const px = x + Math.cos(angle) * radius;
                        const py = y + Math.sin(angle) * radius;
                        if (j === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }
                    ctx.stroke();
                }
                break;
        }
    }

    loadImage(imageType) {
        this.clearCanvas();
        // Try to load realistic outline from assets first
        this.loadFromAsset(imageType, () => {
            // Fallback to procedural template if no asset
        this.drawImage(imageType);
        });
    }

    loadFromAsset(imageType, onFail) {
        const trySources = [
            `assets/drawings/${imageType}.svg`,
            `assets/drawings/${imageType}.png`
        ];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let index = 0;
        const tryNext = () => {
            if (index >= trySources.length) {
                if (typeof onFail === 'function') onFail();
                return;
            }
            img.src = trySources[index++];
        };
        img.onload = () => {
            // Use natural size and CSS pixel canvas size to compute proper fit
            const natW = img.naturalWidth || img.width || 1;
            const natH = img.naturalHeight || img.height || 1;
            const cw = this.cssWidth;  // CSS pixels thanks to transform
            const ch = this.cssHeight; // CSS pixels
            const scale = Math.min(cw / natW, ch / natH) * 0.9; // add 10% padding
            const drawW = natW * scale;
            const drawH = natH * scale;
            const dx = (cw - drawW) / 2;
            const dy = (ch - drawH) / 2;
            // Clear then draw centered
            this.clearCanvas();
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(img, dx, dy, drawW, drawH);
            this.showMessage('Đã tải mẫu thực tế', 'info');
        };
        img.onerror = tryNext;
        tryNext();
    }

    drawImage(imageType) {
        // Make all templates larger and bolder for easy coloring
        this.ctx.save();
        this.ctx.translate(250, 250);
        this.ctx.scale(1.25, 1.25); // enlarge ~25%
        this.ctx.translate(-250, -250);
        const originalLineWidth = this.ctx.lineWidth;
        this.ctx.lineWidth = Math.max(4, originalLineWidth * 1.4);

        switch(imageType) {
            case 'house':
                this.drawHouse();
                break;
            case 'flower':
                this.drawFlower();
                break;
            case 'butterfly':
                this.drawButterfly();
                break;
            case 'tree':
                this.drawTree();
                break;
            case 'car':
                this.drawCar();
                break;
            case 'cat':
                this.drawCat();
                break;
            case 'sun':
                this.drawSun();
                break;
            case 'heart':
                this.drawHeart();
                break;
            case 'fish':
                this.drawFish();
                break;
            case 'bird':
                this.drawBird();
                break;
            case 'rocket':
                this.drawRocket();
                break;
            case 'rainbow':
                this.drawRainbow();
                break;
            case 'train':
                this.drawTrain();
                break;
            case 'boat':
                this.drawBoat();
                break;
            case 'castle':
                this.drawCastle();
                break;
            case 'dinosaur':
                this.drawDinosaur();
                break;
            case 'robot':
                this.drawRobot();
                break;
            case 'star':
                this.drawStar();
                break;
            case 'balloon':
                this.drawBalloon();
                break;
            case 'icecream':
                this.drawIceCream();
                break;
            case 'cupcake':
                this.drawCupcake();
                break;
            case 'airplane':
                this.drawAirplane();
                break;
            case 'submarine':
                this.drawSubmarine();
                break;
            case 'giraffe':
                this.drawGiraffe();
                break;
            case 'moon':
                this.drawMoon();
                break;
            case 'cloud':
                this.drawCloud();
                break;
            case 'mountain':
                this.drawMountain();
                break;
            case 'river':
                this.drawRiver();
                break;
            case 'bridge':
                this.drawBridge();
                break;
            case 'lighthouse':
                this.drawLighthouse();
                break;
            case 'windmill':
                this.drawWindmill();
                break;
            case 'tent':
                this.drawTent();
                break;
            case 'camera':
                this.drawCamera();
                break;
            case 'book':
                this.drawBook();
                break;
            case 'pencil':
                this.drawPencil();
                break;
            case 'candy':
                this.drawCandy();
                break;
            case 'cake':
                this.drawCake();
                break;
            case 'pizza':
                this.drawPizza();
                break;
            case 'icecream':
                this.drawIceCream();
                break;
            case 'cupcake':
                this.drawCupcake();
                break;
            case 'cookie':
                this.drawCookie();
                break;
            case 'donut':
                this.drawDonut();
                break;
            case 'hamburger':
                this.drawHamburger();
                break;
            case 'frenchfries':
                this.drawFrenchFries();
                break;
            case 'soda':
                this.drawSoda();
                break;
            case 'coffee':
                this.drawCoffee();
                break;
            case 'tea':
                this.drawTea();
                break;
            case 'bottle':
                this.drawBottle();
                break;
            case 'plate':
                this.drawPlate();
                break;
            case 'fork':
                this.drawFork();
                break;
            case 'spoon':
                this.drawSpoon();
                break;
            case 'knife':
                this.drawKnife();
                break;
        }

        // restore transform/line style
        this.ctx.lineWidth = originalLineWidth;
        this.ctx.restore();
    }

    drawRobot(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.strokeRect(210,200,80,90); c.strokeRect(230,170,40,30); c.beginPath(); c.arc(235,185,5,0,Math.PI*2); c.arc(265,185,5,0,Math.PI*2); c.stroke(); c.strokeRect(190,215,20,60); c.strokeRect(290,215,20,60); c.strokeRect(230,290,20,25); c.strokeRect(250,290,20,25); }
    drawStar(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; const cx=250, cy=230, r1=50, r2=20; c.beginPath(); for(let i=0;i<10;i++){ const a=Math.PI/5*i; const r=(i%2? r2:r1); const x=cx+Math.cos(a- Math.PI/2)*r; const y=cy+Math.sin(a- Math.PI/2)*r; i? c.lineTo(x,y): c.moveTo(x,y);} c.closePath(); c.stroke(); }
    drawBalloon(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.beginPath(); c.ellipse(250,210,40,55,0,0,Math.PI*2); c.stroke(); c.beginPath(); c.moveTo(250,265); c.lineTo(250,320); c.stroke(); c.beginPath(); c.moveTo(240,260); c.lineTo(260,260); c.lineTo(250,270); c.closePath(); c.stroke(); }
    drawIceCream(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.beginPath(); c.moveTo(230,290); c.lineTo(270,290); c.lineTo(250,330); c.closePath(); c.stroke(); c.beginPath(); c.arc(250,260,35,0,Math.PI,true); c.stroke(); }
    drawCupcake(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.strokeRect(220,280,60,40); c.beginPath(); c.moveTo(220,280); c.quadraticCurveTo(250,250,280,280); c.stroke(); c.beginPath(); c.arc(250,245,6,0,Math.PI*2); c.stroke(); }
    drawAirplane(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.beginPath(); c.moveTo(180,260); c.lineTo(320,230); c.lineTo(300,250); c.lineTo(320,270); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(230,245); c.lineTo(200,225); c.moveTo(240,270); c.lineTo(210,290); c.stroke(); }
    drawSubmarine(){ const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; c.beginPath(); c.ellipse(250,260,90,35,0,0,Math.PI*2); c.stroke(); c.beginPath(); c.strokeRect(280,240,30,40); c.beginPath(); c.arc(220,260,10,0,Math.PI*2); c.arc(250,260,10,0,Math.PI*2); c.arc(280,260,10,0,Math.PI*2); c.stroke(); }
    drawGiraffe(){
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4;
        // body (big oval)
        c.beginPath(); c.ellipse(300,300,85,45,0,0,Math.PI*2); c.stroke();
        // legs (four straight legs)
        c.beginPath(); c.moveTo(260,330); c.lineTo(260,360); c.moveTo(290,330); c.lineTo(290,360); c.moveTo(320,330); c.lineTo(320,360); c.moveTo(350,330); c.lineTo(350,360); c.stroke();
        // long neck
        c.beginPath(); c.moveTo(260,280); c.lineTo(235,210); c.stroke();
        // head
        c.beginPath(); c.ellipse(225,195,20,14,0,0,Math.PI*2); c.stroke();
        // ears
        c.beginPath(); c.moveTo(214,188); c.lineTo(206,178); c.moveTo(236,188); c.lineTo(244,178); c.stroke();
        // ossicones (two short horns)
        c.beginPath(); c.moveTo(220,182); c.lineTo(220,172); c.moveTo(230,182); c.lineTo(230,172); c.stroke();
        // tail
        c.beginPath(); c.moveTo(360,300); c.quadraticCurveTo(380,305,370,320); c.stroke();
        // simple spots (few circles)
        ;[280,300,320,340].forEach(x=>{ c.beginPath(); c.arc(x,300,6,0,Math.PI*2); c.stroke(); });
    }

    // Additional drawing functions for more variety - Enhanced with more details
    drawMoon(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,40,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(240,240,30,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(230,230,5,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(260,240,3,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,260,4,0,Math.PI*2); c.stroke();
    }
    
    drawCloud(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(220,250,25,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(250,250,30,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(280,250,25,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(235,230,20,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(265,230,20,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,270,15,0,Math.PI*2); c.stroke();
    }
    
    drawMountain(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(200,300); c.lineTo(250,200); c.lineTo(300,300); c.stroke(); 
        c.beginPath(); c.moveTo(220,300); c.lineTo(280,250); c.lineTo(320,300); c.stroke();
        c.beginPath(); c.moveTo(230,280); c.lineTo(240,260); c.stroke();
        c.beginPath(); c.moveTo(260,280); c.lineTo(270,260); c.stroke();
        c.beginPath(); c.arc(250,220,3,0,Math.PI*2); c.stroke();
    }
    
    drawRiver(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(200,250); c.quadraticCurveTo(250,270,300,250); c.quadraticCurveTo(350,230,400,250); c.stroke(); 
        c.beginPath(); c.moveTo(220,260); c.quadraticCurveTo(270,280,320,260); c.stroke();
        c.beginPath(); c.moveTo(240,255); c.lineTo(260,255); c.stroke();
        c.beginPath(); c.moveTo(280,245); c.lineTo(300,245); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(300,250,2,0,Math.PI*2); c.stroke();
    }
    
    drawBridge(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(200,280); c.lineTo(300,280); c.stroke(); 
        c.beginPath(); c.moveTo(210,300); c.lineTo(210,280); c.stroke(); 
        c.beginPath(); c.moveTo(230,300); c.lineTo(230,280); c.stroke(); 
        c.beginPath(); c.moveTo(250,300); c.lineTo(250,280); c.stroke(); 
        c.beginPath(); c.moveTo(270,300); c.lineTo(270,280); c.stroke(); 
        c.beginPath(); c.moveTo(290,300); c.lineTo(290,280); c.stroke();
        c.beginPath(); c.moveTo(200,280); c.lineTo(200,275); c.stroke();
        c.beginPath(); c.moveTo(300,280); c.lineTo(300,275); c.stroke();
    }
    
    drawLighthouse(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(240,200,20,80); 
        c.beginPath(); c.moveTo(230,200); c.lineTo(270,200); c.lineTo(250,180); c.closePath(); c.stroke(); 
        c.beginPath(); c.arc(250,190,3,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,220); c.lineTo(250,240); c.stroke();
        c.beginPath(); c.moveTo(250,260); c.lineTo(250,280); c.stroke();
        c.strokeRect(235,250,30,10);
    }
    
    drawWindmill(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(245,220,10,60); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,220); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(220,200); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,180); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(280,200); c.stroke();
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,220); c.stroke();
        c.beginPath(); c.arc(250,200,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(245,250); c.lineTo(255,250); c.stroke();
    }
    
    drawTent(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(250,200); c.lineTo(200,300); c.lineTo(300,300); c.closePath(); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,300); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(220,280); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(280,280); c.stroke();
        c.beginPath(); c.arc(250,220,3,0,Math.PI*2); c.stroke();
    }
    
    drawCamera(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(220,220,60,40); 
        c.beginPath(); c.arc(250,240,15,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(250,240,8,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,220); c.stroke();
        c.beginPath(); c.moveTo(240,230); c.lineTo(260,230); c.stroke();
        c.beginPath(); c.moveTo(240,250); c.lineTo(260,250); c.stroke();
        c.strokeRect(230,210,40,5);
    }
    
    drawBook(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(220,220,60,40); 
        c.beginPath(); c.moveTo(240,220); c.lineTo(240,260); c.stroke(); 
        c.beginPath(); c.moveTo(260,220); c.lineTo(260,260); c.stroke();
        c.beginPath(); c.moveTo(250,220); c.lineTo(250,260); c.stroke();
        c.beginPath(); c.moveTo(220,240); c.lineTo(280,240); c.stroke();
        c.beginPath(); c.arc(250,230,2,0,Math.PI*2); c.stroke();
    }
    
    drawPencil(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,300); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(240,210); c.lineTo(260,210); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(240,260); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(260,260); c.stroke();
        c.beginPath(); c.moveTo(250,280); c.lineTo(240,290); c.stroke();
        c.beginPath(); c.moveTo(250,280); c.lineTo(260,290); c.stroke();
    }
    
    drawCandy(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(220,250); c.lineTo(280,250); c.lineTo(280,270); c.lineTo(220,270); c.closePath(); c.stroke(); 
        c.beginPath(); c.moveTo(240,250); c.lineTo(240,270); c.stroke(); 
        c.beginPath(); c.moveTo(260,250); c.lineTo(260,270); c.stroke();
        c.beginPath(); c.arc(230,260,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(270,260,2,0,Math.PI*2); c.stroke();
    }
    
    drawCake(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(220,250,60,30); 
        c.beginPath(); c.moveTo(220,250); c.quadraticCurveTo(250,230,280,250); c.stroke(); 
        c.beginPath(); c.moveTo(230,240); c.lineTo(230,220); c.stroke(); 
        c.beginPath(); c.moveTo(270,240); c.lineTo(270,220); c.stroke();
        c.beginPath(); c.moveTo(230,220); c.lineTo(270,220); c.stroke();
        c.beginPath(); c.arc(250,225,2,0,Math.PI*2); c.stroke();
    }
    
    drawPizza(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,50,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,300); c.stroke(); 
        c.beginPath(); c.moveTo(200,250); c.lineTo(300,250); c.stroke(); 
        c.beginPath(); c.arc(230,230,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(270,230,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(230,270,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(270,270,3,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
    }
    
    drawCookie(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,35,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(240,240,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(260,240,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(240,260,3,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(260,260,3,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(230,250); c.lineTo(270,250); c.stroke();
    }
    
    drawDonut(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,40,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(250,250,20,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(230,250); c.lineTo(270,250); c.stroke();
        c.beginPath(); c.moveTo(250,230); c.lineTo(250,270); c.stroke();
    }
    
    drawHamburger(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(220,220,60,15); 
        c.strokeRect(220,240,60,15); 
        c.strokeRect(220,260,60,15); 
        c.beginPath(); c.moveTo(220,235); c.lineTo(280,235); c.stroke(); 
        c.beginPath(); c.moveTo(220,255); c.lineTo(280,255); c.stroke();
        c.beginPath(); c.arc(250,230,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
    }
    
    drawFrenchFries(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(220,200,15,60); 
        c.strokeRect(240,200,15,60); 
        c.strokeRect(260,200,15,60); 
        c.strokeRect(230,190,35,10);
        c.beginPath(); c.moveTo(225,220); c.lineTo(235,220); c.stroke();
        c.beginPath(); c.moveTo(245,220); c.lineTo(255,220); c.stroke();
        c.beginPath(); c.moveTo(265,220); c.lineTo(275,220); c.stroke();
    }
    
    drawSoda(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(240,200,20,60); 
        c.beginPath(); c.moveTo(230,200); c.lineTo(270,200); c.lineTo(250,180); c.closePath(); c.stroke(); 
        c.beginPath(); c.moveTo(250,180); c.lineTo(250,160); c.stroke();
        c.beginPath(); c.moveTo(250,220); c.lineTo(250,240); c.stroke();
        c.beginPath(); c.moveTo(250,260); c.lineTo(250,280); c.stroke();
    }
    
    drawCoffee(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,30,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.moveTo(280,250); c.lineTo(300,250); c.stroke(); 
        c.beginPath(); c.moveTo(300,250); c.lineTo(300,240); c.stroke();
        c.beginPath(); c.arc(250,250,5,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,220); c.lineTo(250,240); c.stroke();
    }
    
    drawTea(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,25,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.moveTo(275,250); c.lineTo(290,250); c.stroke(); 
        c.beginPath(); c.moveTo(290,250); c.lineTo(290,240); c.stroke(); 
        c.beginPath(); c.moveTo(290,240); c.lineTo(280,230); c.stroke();
        c.beginPath(); c.arc(250,250,3,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,230); c.lineTo(250,270); c.stroke();
    }
    
    drawBottle(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.strokeRect(240,200,20,60); 
        c.beginPath(); c.moveTo(230,200); c.lineTo(270,200); c.lineTo(250,180); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(250,220); c.lineTo(250,240); c.stroke();
        c.beginPath(); c.moveTo(250,260); c.lineTo(250,280); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
    }
    
    drawPlate(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.arc(250,250,40,0,Math.PI*2); c.stroke(); 
        c.beginPath(); c.arc(250,250,35,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(250,250,2,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(230,250); c.lineTo(270,250); c.stroke();
        c.beginPath(); c.moveTo(250,230); c.lineTo(250,270); c.stroke();
    }
    
    drawFork(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,280); c.stroke(); 
        c.beginPath(); c.moveTo(240,200); c.lineTo(240,220); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,220); c.stroke(); 
        c.beginPath(); c.moveTo(260,200); c.lineTo(260,220); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(250,270); c.stroke();
    }
    
    drawSpoon(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,280); c.stroke(); 
        c.beginPath(); c.ellipse(250,200,8,12,0,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(250,270); c.stroke();
        c.beginPath(); c.arc(250,200,2,0,Math.PI*2); c.stroke();
    }
    
    drawKnife(){ 
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4; 
        c.beginPath(); c.moveTo(250,200); c.lineTo(250,280); c.stroke(); 
        c.beginPath(); c.moveTo(250,200); c.lineTo(270,220); c.lineTo(250,240); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(250,250); c.lineTo(250,270); c.stroke();
        c.beginPath(); c.moveTo(250,260); c.lineTo(240,270); c.stroke();
    }


    drawFish() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // body
        this.ctx.beginPath(); this.ctx.ellipse(250, 220, 80, 45, 0, 0, Math.PI*2); this.ctx.stroke();
        // tail
        this.ctx.beginPath(); this.ctx.moveTo(330, 220); this.ctx.lineTo(370, 200); this.ctx.lineTo(370, 240); this.ctx.closePath(); this.ctx.stroke();
        // eye
        this.ctx.beginPath(); this.ctx.arc(210, 210, 6, 0, Math.PI*2); this.ctx.stroke();
        // fin
        this.ctx.beginPath(); this.ctx.moveTo(250, 220); this.ctx.lineTo(230, 250); this.ctx.lineTo(260, 250); this.ctx.closePath(); this.ctx.stroke();
    }

    drawBird() {
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4;
        c.beginPath(); c.ellipse(260,235,65,40,0,0,Math.PI*2); c.stroke();
        c.beginPath(); c.arc(205,215,22,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(183,215); c.lineTo(165,223); c.lineTo(183,231); c.closePath(); c.stroke();
        c.beginPath(); c.ellipse(265,235,28,18,-0.5,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,275); c.lineTo(250,300); c.moveTo(270,275); c.lineTo(270,300); c.stroke();
    }

    drawRocket() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // body
        this.ctx.beginPath(); this.ctx.moveTo(250, 120); this.ctx.lineTo(300, 260); this.ctx.lineTo(200, 260); this.ctx.closePath(); this.ctx.stroke();
        // window
        this.ctx.beginPath(); this.ctx.arc(250, 200, 18, 0, Math.PI*2); this.ctx.stroke();
        // fins
        this.ctx.beginPath(); this.ctx.moveTo(200, 260); this.ctx.lineTo(170, 300); this.ctx.lineTo(210, 260); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.moveTo(300, 260); this.ctx.lineTo(330, 300); this.ctx.lineTo(290, 260); this.ctx.stroke();
        // flames
        this.ctx.beginPath(); this.ctx.moveTo(225, 300); this.ctx.quadraticCurveTo(250, 330, 275, 300); this.ctx.stroke();
    }

    drawRainbow() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 4;
        for(let i=0;i<6;i++){ this.ctx.beginPath(); this.ctx.arc(250, 290, 70+i*10, Math.PI, 2*Math.PI); this.ctx.stroke(); }
        // clouds
        this.ctx.lineWidth = 3;
        this.ctx.beginPath(); this.ctx.arc(185, 290, 18, 0, Math.PI*2); this.ctx.arc(205, 298, 14, 0, Math.PI*2); this.ctx.arc(225, 290, 18, 0, Math.PI*2); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(275, 290, 18, 0, Math.PI*2); this.ctx.arc(295, 298, 14, 0, Math.PI*2); this.ctx.arc(315, 290, 18, 0, Math.PI*2); this.ctx.stroke();
    }

    drawTrain() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // engine
        this.ctx.strokeRect(140, 240, 80, 60); this.ctx.strokeRect(220, 220, 40, 80); this.ctx.strokeRect(260, 240, 100, 60);
        // wheels
        [170, 210, 290, 330].forEach(x=>{ this.ctx.beginPath(); this.ctx.arc(x, 310, 14, 0, Math.PI*2); this.ctx.stroke(); });
        // chimney
        this.ctx.beginPath(); this.ctx.moveTo(230, 220); this.ctx.lineTo(230, 200); this.ctx.lineTo(245, 200); this.ctx.lineTo(245, 220); this.ctx.stroke();
    }

    drawBoat() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // hull
        this.ctx.beginPath(); this.ctx.moveTo(180, 280); this.ctx.lineTo(320, 280); this.ctx.lineTo(300, 320); this.ctx.lineTo(200, 320); this.ctx.closePath(); this.ctx.stroke();
        // mast
        this.ctx.beginPath(); this.ctx.moveTo(250, 280); this.ctx.lineTo(250, 200); this.ctx.stroke();
        // sail
        this.ctx.beginPath(); this.ctx.moveTo(250, 200); this.ctx.lineTo(300, 240); this.ctx.lineTo(250, 240); this.ctx.closePath(); this.ctx.stroke();
    }

    drawCastle() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // base
        this.ctx.strokeRect(160, 240, 180, 100);
        // towers
        this.ctx.strokeRect(140, 220, 40, 120); this.ctx.strokeRect(320, 220, 40, 120);
        // doors & windows
        this.ctx.beginPath(); this.ctx.moveTo(250, 340); this.ctx.lineTo(250, 300); this.ctx.lineTo(230, 300); this.ctx.lineTo(270, 300); this.ctx.stroke();
        this.ctx.strokeRect(190, 260, 20, 20); this.ctx.strokeRect(290, 260, 20, 20);
        // battlements
        for(let x=160;x<=340;x+=20){ this.ctx.beginPath(); this.ctx.moveTo(x,240); this.ctx.lineTo(x+10,240); this.ctx.lineTo(x+10,230); this.ctx.lineTo(x,230); this.ctx.closePath(); this.ctx.stroke(); }
    }

    drawDinosaur() {
        this.ctx.strokeStyle = '#2C3E50'; this.ctx.lineWidth = 3;
        // body
        this.ctx.beginPath(); this.ctx.ellipse(260, 260, 80, 40, 0, 0, Math.PI*2); this.ctx.stroke();
        // neck & head
        this.ctx.beginPath(); this.ctx.moveTo(210, 250); this.ctx.quadraticCurveTo(200, 200, 230, 190); this.ctx.arc(240, 190, 15, 0, Math.PI*2); this.ctx.stroke();
        // legs
        this.ctx.beginPath(); this.ctx.moveTo(230, 300); this.ctx.lineTo(230, 330); this.ctx.moveTo(290, 300); this.ctx.lineTo(290, 330); this.ctx.stroke();
        // tail
        this.ctx.beginPath(); this.ctx.moveTo(340, 260); this.ctx.quadraticCurveTo(380, 250, 360, 240); this.ctx.stroke();
    }

    drawCat() {
        const c=this.ctx; c.strokeStyle='#2C3E50'; c.lineWidth=4;
        c.beginPath(); c.arc(250,170,58,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(215,130); c.quadraticCurveTo(228,112,238,135); c.lineTo(215,130); c.stroke();
        c.beginPath(); c.moveTo(285,130); c.quadraticCurveTo(272,112,262,135); c.lineTo(285,130); c.stroke();
        c.beginPath(); c.arc(235,165,7,0,Math.PI*2); c.stroke(); c.beginPath(); c.arc(265,165,7,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(250,178); c.lineTo(246,185); c.lineTo(254,185); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(250,185); c.quadraticCurveTo(242,193,236,195); c.moveTo(250,185); c.quadraticCurveTo(258,193,264,195); c.stroke();
        c.beginPath(); c.moveTo(220,175); c.lineTo(200,175); c.moveTo(220,183); c.lineTo(198,183); c.moveTo(280,175); c.lineTo(300,175); c.moveTo(280,183); c.lineTo(302,183); c.stroke();
        c.beginPath(); c.ellipse(250,270,42,58,0,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(290,260); c.quadraticCurveTo(335,250,320,300); c.stroke();
    }

    drawSun() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Sun center - centered
        this.ctx.beginPath();
        this.ctx.arc(250, 200, 40, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Sun rays - centered
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const startX = 250 + Math.cos(angle) * 50;
            const startY = 200 + Math.sin(angle) * 50;
            const endX = 250 + Math.cos(angle) * 70;
            const endY = 200 + Math.sin(angle) * 70;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // Sun face - centered
        this.ctx.beginPath();
        this.ctx.arc(235, 185, 5, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(265, 185, 5, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(250, 210, 15, 0, Math.PI);
        this.ctx.stroke();
    }

    drawHeart() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Heart shape - centered
        this.ctx.beginPath();
        this.ctx.moveTo(250, 250);
        this.ctx.bezierCurveTo(250, 200, 200, 200, 200, 230);
        this.ctx.bezierCurveTo(200, 260, 250, 300, 250, 300);
        this.ctx.bezierCurveTo(250, 300, 300, 260, 300, 230);
        this.ctx.bezierCurveTo(300, 200, 250, 200, 250, 250);
        this.ctx.stroke();
        
        // Heart decorations - centered
        this.ctx.beginPath();
        this.ctx.arc(230, 220, 3, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(270, 220, 3, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    selectColor(color, button) {
        this.currentColor = color;
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.animateButton(button);
    }

    selectTool(toolId, button) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.animateButton(button);

        switch(toolId) {
            case 'brushTool':
                this.currentTool = 'brush';
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraserTool':
                this.currentTool = 'eraser';
                this.canvas.style.cursor = 'grab';
                break;
            case 'clearTool':
                this.clearCanvas();
                break;
            case 'saveTool':
                this.saveDrawing();
                break;
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.ctx.beginPath();
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'brush') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.brushSize * 2;
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }

    clearCanvas() {
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset drawing state
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    saveDrawing() {
        const dataURL = this.canvas.toDataURL('image/png');
        const data = gameState.getData();
        const newDrawing = {
            id: Date.now(),
            dataURL: dataURL,
            timestamp: new Date().toISOString()
        };
        
        gameState.updateData({
            coloringDrawings: [...data.coloringDrawings, newDrawing]
        });
        
        this.showMessage('Tranh đã được lưu!', 'success');
        gameState.addAchievement('Họa sĩ tài năng');
    }


    drawHouse() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // House base - centered
        this.ctx.strokeRect(150, 200, 200, 150);
        
        // Roof - centered
        this.ctx.beginPath();
        this.ctx.moveTo(130, 200);
        this.ctx.lineTo(250, 120);
        this.ctx.lineTo(370, 200);
        this.ctx.stroke();
        
        // Door - centered
        this.ctx.strokeRect(230, 280, 40, 70);
        
        // Windows - centered
        this.ctx.strokeRect(180, 230, 30, 30);
        this.ctx.strokeRect(290, 230, 30, 30);
        
        // Sun - centered
        this.ctx.beginPath();
        this.ctx.arc(400, 100, 30, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Grass - centered
        this.ctx.strokeStyle = '#2ECC71';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 500; i += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 400);
            this.ctx.lineTo(i + 5, 390);
            this.ctx.stroke();
        }
    }

    drawFlower() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Flower center - centered
        this.ctx.beginPath();
        this.ctx.arc(250, 200, 20, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Petals - centered
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = 250 + Math.cos(angle) * 40;
            const y = 200 + Math.sin(angle) * 40;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        
        // Stem - centered
        this.ctx.beginPath();
        this.ctx.moveTo(250, 220);
        this.ctx.lineTo(250, 300);
        this.ctx.stroke();
        
        // Leaves - centered
        this.ctx.beginPath();
        this.ctx.ellipse(230, 250, 20, 10, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.ellipse(270, 270, 20, 10, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    drawButterfly() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Body - centered
        this.ctx.beginPath();
        this.ctx.moveTo(250, 150);
        this.ctx.lineTo(250, 250);
        this.ctx.stroke();
        
        // Wings - centered
        this.ctx.beginPath();
        this.ctx.ellipse(220, 180, 30, 20, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.ellipse(280, 180, 30, 20, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.ellipse(210, 220, 25, 15, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.ellipse(290, 220, 25, 15, 0, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Antennae - centered
        this.ctx.beginPath();
        this.ctx.moveTo(250, 150);
        this.ctx.lineTo(240, 140);
        this.ctx.moveTo(250, 150);
        this.ctx.lineTo(260, 140);
        this.ctx.stroke();
    }

    drawTree() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Trunk - centered
        this.ctx.strokeRect(240, 250, 20, 100);
        
        // Leaves - centered
        this.ctx.beginPath();
        this.ctx.arc(250, 200, 60, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Branches - centered
        this.ctx.beginPath();
        this.ctx.moveTo(250, 250);
        this.ctx.lineTo(210, 220);
        this.ctx.moveTo(250, 250);
        this.ctx.lineTo(290, 220);
        this.ctx.stroke();
    }

    drawCar() {
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        
        // Car body - centered
        this.ctx.strokeRect(150, 200, 200, 80);
        
        // Wheels - centered
        this.ctx.beginPath();
        this.ctx.arc(190, 300, 20, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(310, 300, 20, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Windows - centered
        this.ctx.strokeRect(170, 210, 50, 40);
        this.ctx.strokeRect(280, 210, 50, 40);
        
        // Headlights - centered
        this.ctx.beginPath();
        this.ctx.arc(150, 220, 8, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(150, 260, 8, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 2000);
    }
}

// Memory Game
class MemoryGame {
    constructor() {
        this.grid = document.getElementById('memoryGrid');
        this.scoreElement = document.getElementById('memoryScore');
        this.movesElement = document.getElementById('memoryMoves');
        this.timeElement = document.getElementById('memoryTime');
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.gameTimer = null;
        this.icons = ['🐱', '🐶', '🐰', '🐸', '🐯', '🦁', '🐨', '🐼'];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.newGame();
    }

    setupEventListeners() {
        document.getElementById('newMemoryGame').addEventListener('click', () => this.newGame());
        document.getElementById('memoryHint').addEventListener('click', () => this.showHint());
    }

    newGame() {
        this.score = 0;
        this.moves = 0;
        this.time = 0;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.updateDisplay();
        this.createCards();
        this.startTimer();
    }

    createCards() {
        this.grid.innerHTML = '';
        const cards = [...this.icons, ...this.icons].sort(() => Math.random() - 0.5);
        
        cards.forEach((icon, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.icon = icon;
            card.dataset.index = index;
            card.innerHTML = '<i class="fas fa-question"></i>';
            
            card.addEventListener('click', () => this.flipCard(card));
            this.grid.appendChild(card);
        });
    }

    flipCard(card) {
        if (this.flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        card.classList.add('flipped');
        card.innerHTML = card.dataset.icon;
        this.flippedCards.push(card);
        this.animateCard(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.icon === card2.dataset.icon) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.score += 10;
            this.animateMatch(card1, card2);
            
            if (this.matchedPairs === this.icons.length) {
                this.gameComplete();
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                card1.innerHTML = '<i class="fas fa-question"></i>';
                card2.innerHTML = '<i class="fas fa-question"></i>';
            }, 500);
        }
        
        this.flippedCards = [];
        this.updateDisplay();
    }

    animateCard(card) {
        card.style.transform = 'scale(1.1)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 200);
    }

    animateMatch(card1, card2) {
        [card1, card2].forEach(card => {
            card.style.animation = 'matchPulse 0.6s ease';
            setTimeout(() => {
                card.style.animation = '';
            }, 600);
        });
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.time++;
            this.updateDisplay();
        }, 1000);
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
        this.timeElement.textContent = this.formatTime(this.time);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    gameComplete() {
        clearInterval(this.gameTimer);
        const data = gameState.getData();
        if (this.score > data.memoryBestScore) {
            gameState.updateData({ memoryBestScore: this.score });
            gameState.addAchievement('Trí nhớ siêu phàm');
        }
        this.showMessage('Chúc mừng! Bạn đã hoàn thành trò chơi!', 'success');
    }

    showHint() {
        if (this.flippedCards.length === 1) {
            const firstCard = this.flippedCards[0];
            const matchingCard = Array.from(this.grid.children).find(card => 
                card.dataset.icon === firstCard.dataset.icon && card !== firstCard
            );
            if (matchingCard) {
                matchingCard.style.border = '3px solid #FFD93D';
                setTimeout(() => {
                    matchingCard.style.border = '';
                }, 2000);
            }
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}


// Piano Game
class PianoGame {
    constructor() {
        this.audioContext = null;
        this.oscillators = {};
        this.recordings = [];
        this.isRecording = false;
        this.currentRecording = [];
        this.init();
    }

    init() {
        this.setupPianoKeys();
        this.setupEventListeners();
        this.initAudioContext();
    }

    setupPianoKeys() {
        const pianoKeys = document.getElementById('pianoKeys');
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // Only white keys
        const octaves = [3, 4, 5]; // 3 octaves
        
        pianoKeys.innerHTML = '';
        
        octaves.forEach(octave => {
            notes.forEach((note, index) => {
                const key = document.createElement('div');
                const fullNote = `${note}${octave}`;
                
                key.className = 'piano-key';
                key.dataset.note = fullNote;
                key.textContent = note;
                key.title = fullNote;
                
                key.addEventListener('mousedown', () => this.playNote(fullNote, key));
                key.addEventListener('mouseup', () => this.stopNote(fullNote));
                key.addEventListener('mouseleave', () => this.stopNote(fullNote));
                
                pianoKeys.appendChild(key);
            });
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.playSong(e.target.dataset.song, e.target));
        });
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported');
        }
    }

    playNote(note, keyElement) {
        if (!this.audioContext) return;
        
        const frequency = this.getFrequency(note);
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        
        oscillator.start();
        
        this.oscillators[note] = { oscillator, gainNode };
        
        if (this.isRecording) {
            this.currentRecording.push({
                note,
                time: this.audioContext.currentTime,
                duration: 0.5
            });
        }
        
        this.animateKey(keyElement);
    }

    stopNote(note) {
        if (this.oscillators[note]) {
            const { oscillator, gainNode } = this.oscillators[note];
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            oscillator.stop(this.audioContext.currentTime + 0.1);
            delete this.oscillators[note];
        }
    }

    getFrequency(note) {
        const frequencies = {
            // Octave 3 - Only white keys
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            // Octave 4 - Only white keys
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            // Octave 5 - Only white keys
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };
        return frequencies[note] || 440;
    }

    animateKey(keyElement) {
        keyElement.style.transform = 'translateY(2px)';
        keyElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
        
        setTimeout(() => {
            keyElement.style.transform = '';
            keyElement.style.boxShadow = '';
        }, 100);
    }


    playSong(songName, button) {
        document.querySelectorAll('.song-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const songs = {
            twinkle: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
            happy: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4'],
            mary: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4'],
            jingle: ['E4', 'E4', 'E4', 'E4', 'E4', 'G4', 'C4', 'D4', 'E4', 'F4', 'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'G4']
        };
        
        const song = songs[songName];
        if (song) {
            song.forEach((note, index) => {
                setTimeout(() => {
                    this.playNote(note);
                    setTimeout(() => this.stopNote(note), 400);
                }, index * 500);
            });
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 2000);
    }
}


// Initialize all games when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Thu Gian Games...');
    
    // Initialize games
    const coloringGame = new ColoringGame();
    const memoryGame = new MemoryGame();
    const pianoGame = new PianoGame();
    
    console.log('All games initialized successfully!');
});

// Add CSS for game messages and achievements
const style = document.createElement('style');
style.textContent = `
    .game-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 25px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    }
    
    .game-message.success {
        background: linear-gradient(135deg, #4ECDC4, #45B7B8);
    }
    
    .game-message.info {
        background: linear-gradient(135deg, #3498DB, #2980B9);
    }
    
    .achievement-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD93D, #FFEAA7);
        padding: 30px;
        border-radius: 25px;
        text-align: center;
        z-index: 1001;
        animation: achievementPop 0.5s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .achievement-icon {
        font-size: 3rem;
        margin-bottom: 15px;
    }
    
    .achievement-content h3 {
        color: var(--text-dark);
        margin-bottom: 10px;
        font-family: 'Patrick Hand', cursive;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes achievementPop {
        0% { transform: translate(-50%, -50%) scale(0); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); }
    }
`;
document.head.appendChild(style);


// Dino Runner - simple offline style
class DinoRunner {
    constructor(){
        this.canvas = document.getElementById('dinoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.W = this.canvas.width; this.H = this.canvas.height;
        this.groundY = this.H - 22;
        this.colors = { fg: '#2C3E50', bg:'#ffffff', cloud:'#94a3b8' };
        this.state = 'idle'; // idle|running|dead
        this.time = 0;
        this.attachEvents();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.reset();
        this.drawScene(0);
    }
    resizeCanvas(){
        // Fit canvas neatly into its card (max 720px wide, 3:1 aspect)
        const parent = this.canvas.parentElement || this.canvas;
        const cssW = Math.min(720, Math.max(300, parent.clientWidth - 20));
        const cssH = Math.round(cssW / 3); // 3:1 aspect like the original
        this.canvas.style.width = cssW + 'px';
        this.canvas.style.height = cssH + 'px';
        this.canvas.width = Math.round(cssW * this.dpr);
        this.canvas.height = Math.round(cssH * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.W = cssW; this.H = cssH; this.groundY = this.H - 22;
    }
    attachEvents(){
        const startBtn = document.getElementById('dinoStart');
        startBtn.addEventListener('click', ()=> this.start());
        const onJump = ()=>{ if(this.state==='running'){ if(this.dino.duck) return; if(this.dino.onGround){ this.dino.vy = -11; this.dino.onGround=false; }}}
        const onDuckDown = (d)=>{ if(this.state==='running'){ this.dino.duck = d; }}
        this.canvas.addEventListener('mousedown', onJump);
        window.addEventListener('keydown', (e)=>{
            if(e.code==='Space' || e.code==='ArrowUp') onJump();
            if(e.code==='ArrowDown') onDuckDown(true);
            if(e.code==='Enter' && this.state==='dead') this.start();
        });
        window.addEventListener('keyup', (e)=>{ if(e.code==='ArrowDown') onDuckDown(false); });
    }
    reset(){
        this.dino = { x:40, y:this.groundY-40, w:44, h:40, vy:0, onGround:true, leg:0, duck:false };
        this.speed = 3.2; // slower for primary students
        this.score = 0; this.high= Number(localStorage.getItem('dinoHigh')||0);
        this.clouds = []; this.groundX = 0; this.obstacles=[]; this.birds=[]; this.spawnTimer=0; this.dayNight=0;
        this.updateScore();
    }
    start(){ this.reset(); this.state='running'; this.prev=performance.now(); requestAnimationFrame(this.loop); }
    updateScore(){ document.getElementById('dinoScore').textContent = `${this.score}  •  kỷ lục ${this.high}`; }
    spawn(){
        const r = Math.random();
        if(r < 0.7){ // cactus group
            const count = 1 + Math.floor(Math.random()*3);
            let x = this.W + 20;
            for(let i=0;i<count;i++){
                const h = 28 + Math.floor(Math.random()*24);
                const w = 12 + Math.floor(Math.random()*6);
                this.obstacles.push({ x, y:this.groundY-h, w, h, type:'cactus' });
                x += w + 12;
            }
        } else { // bird (pterodactyl)
            const heights = [this.groundY-70, this.groundY-100, this.groundY-40];
            this.birds.push({ x:this.W+20, y: heights[Math.floor(Math.random()*heights.length)], w:38, h:22, flap:0 });
        }
    }
    physics(dt){
        // gravity
        this.dino.vy += 0.55; this.dino.y += this.dino.vy;
        const groundH = this.dino.duck ? 28:40;
        const targetY = this.groundY - groundH;
        if(this.dino.y >= targetY){ this.dino.y = targetY; this.dino.vy=0; this.dino.onGround=true; } else this.dino.onGround=false;
        // world scroll
        this.groundX = (this.groundX - this.speed) % 40;
        if(this.clouds.length<3 && Math.random()<0.02){ this.clouds.push({ x:this.W+10, y:30+Math.random()*60, s:1+Math.random()*0.5 }); }
        this.clouds.forEach(cl=> cl.x -= cl.s);
        this.clouds = this.clouds.filter(cl=> cl.x>-80);
        // obstacles
        this.spawnTimer -= dt; if(this.spawnTimer<=0){ this.spawn(); this.spawnTimer = 1200 + Math.random()*800; }
        this.obstacles.forEach(o=> o.x -= this.speed);
        this.obstacles = this.obstacles.filter(o=> o.x + o.w > -5);
        // birds
        this.birds.forEach(b=>{ b.x -= this.speed+1.2; b.flap += dt; });
        this.birds = this.birds.filter(b=> b.x + b.w > -5);
        // collisions
        const dbox = { x:this.dino.x, y:this.dino.y, w:this.dino.duck?54:44, h:this.dino.duck?28:40 };
        for(const o of this.obstacles){ if(this.hit(dbox,o)) return this.die(); }
        for(const b of this.birds){ if(this.hit(dbox,b)) return this.die(); }
        // score + difficulty
        this.score += Math.floor(dt/12);
        if(this.score % 400 === 0) this.speed += 0.08;
        this.dayNight = (this.dayNight + dt*0.00003) % 1; // subtle day-night tint
        this.updateScore();
        this.dino.leg = (this.dino.leg + dt*0.02) % 2;
    }
    hit(a,b){ return a.x < b.x + (b.w||0) && a.x + a.w > b.x && a.y < b.y + (b.h||0) && a.y + a.h > b.y; }
    die(){
        this.state='dead';
        if(this.score>this.high){ this.high=this.score; localStorage.setItem('dinoHigh', String(this.high)); }
        this.toast('Game Over — Enter để chơi lại');
    }
    drawScene(dt){
        const c=this.ctx; c.clearRect(0,0,this.W,this.H);
        // background tint
        const tint = 1 - (Math.sin(this.dayNight*2*Math.PI)*0.15+0.15);
        c.fillStyle = `rgb(${255*tint},${255*tint},${255*tint})`; c.fillRect(0,0,this.W,this.H);
        // clouds
        c.strokeStyle=this.colors.cloud; c.lineWidth=2;
        this.clouds.forEach(cl=>{ c.beginPath(); c.arc(cl.x,cl.y,10,0,Math.PI*2); c.arc(cl.x+12,cl.y+2,8,0,Math.PI*2); c.arc(cl.x+24,cl.y,10,0,Math.PI*2); c.stroke(); });
        // ground segments
        c.strokeStyle=this.colors.fg; c.lineWidth=2; c.beginPath();
        for(let x=this.groundX; x<this.W; x+=8){ c.moveTo(x,this.groundY); c.lineTo(x+4,this.groundY); }
        c.stroke();
        // obstacles
        this.obstacles.forEach(o=>{ this.drawCactus(o); });
        // birds
        this.birds.forEach(b=>{ this.drawBird(b); });
        // dino
        this.drawDino();
    }
    drawCactus(o){ const c=this.ctx; c.strokeStyle=this.colors.fg; c.lineWidth=2; c.strokeRect(o.x,o.y,o.w,o.h); c.beginPath(); c.moveTo(o.x+o.w*0.25,o.y+o.h*0.3); c.lineTo(o.x+o.w*0.25,o.y); c.moveTo(o.x+o.w*0.75,o.y+o.h*0.5); c.lineTo(o.x+o.w*0.75,o.y+o.h*0.1); c.stroke(); }
    drawBird(b){ const c=this.ctx; c.strokeStyle=this.colors.fg; c.lineWidth=2; // body
        c.beginPath(); c.ellipse(b.x+18,b.y+10,18,10,0,0,Math.PI*2); c.stroke(); // beak
        c.beginPath(); c.moveTo(b.x+35,b.y+10); c.lineTo(b.x+45,b.y+14); c.lineTo(b.x+35,b.y+18); c.stroke(); // wings
        const up = Math.sin(b.flap*0.02)>0; c.beginPath(); if(up){ c.moveTo(b.x+8,b.y+10); c.lineTo(b.x-8,b.y-6);} else { c.moveTo(b.x+8,b.y+10); c.lineTo(b.x-8,b.y+26);} c.stroke(); }
    drawDino(){
        const c=this.ctx; c.strokeStyle=this.colors.fg; c.lineWidth=3; const x=this.dino.x, y=this.dino.y;
        if(this.dino.duck){ // duck form
            c.strokeRect(x, y+6, 54, 22); // body
            // legs short alt
            const off = this.dino.leg<1? 0:6; c.beginPath(); c.moveTo(x+20,y+28); c.lineTo(x+20,y+34-off); c.moveTo(x+36,y+28); c.lineTo(x+36,y+34-6+off); c.stroke();
        } else {
            c.strokeRect(x, y, 34, 28); // body
            c.strokeRect(x+26, y-16, 18, 16); // head
            // eye
            c.beginPath(); c.arc(x+38, y-8, 2, 0, Math.PI*2); c.stroke();
            // tail
            c.beginPath(); c.moveTo(x, y+6); c.lineTo(x-10, y-2); c.stroke();
            // legs running
            const off = this.dino.leg<1? 0:8; c.beginPath(); c.moveTo(x+10,y+28); c.lineTo(x+10,y+36-off); c.moveTo(x+24,y+28); c.lineTo(x+24,y+36-8+off); c.stroke();
        }
    }
    loop = (t)=>{
        const dt = t - this.prev; this.prev = t; if(this.state==='running'){ this.physics(dt); }
        this.drawScene(dt);
        if(this.state==='running') requestAnimationFrame(this.loop);
    }
    toast(msg){ const el=document.createElement('div'); el.className='game-message info'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2000); }
}

