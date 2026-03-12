/**
 * AnimeEngine v6 - Particles System
 * Theme-based background particle effects
 */

const Particles = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    currentTheme: 'default',
    enabled: true,

    // Theme configurations
    themes: {
        default: { type: 'sakura', color: '#ffb7c5', count: 25, speed: 1 },
        manga: { type: 'dots', color: '#000000', count: 20, speed: 0.8 },
        dark: { type: 'snow', color: '#ffffff', count: 30, speed: 0.6 },
        cyberpunk: { type: 'neon', color: '#05d9e8', count: 20, speed: 1.5 },
        matrix: { type: 'matrix', color: '#00ff41', count: 50, speed: 2 },
        mono: { type: 'dots', color: '#000000', count: 15, speed: 0.3 },
        benevaMode: { type: 'dots', color: '#ff6600', count: 25, speed: 1 },
        parafaMode: { type: 'neon', color: '#ff3399', count: 20, speed: 1.2 },
        migueliMode: { type: 'neon', color: '#d926ff', count: 20, speed: 1.2 },
        kauaMode: { type: 'neon', color: '#ffffff', count: 35, speed: 2 },
        ruanMode: { type: 'snow', color: '#00d9ff', count: 25, speed: 1.5 },
        johnMode: { type: 'dots', color: '#d2b48c', count: 15, speed: 0.5 },
        bonfinMode: { type: 'neon', color: '#9933ff', count: 25, speed: 1 },
        arcadeMode: { type: 'matrix', color: '#ff00ff', count: 40, speed: 2.5 },
        zenMode: { type: 'sakura', color: '#a8d5ba', count: 15, speed: 0.4 },
        goldMode: { type: 'snow', color: '#ffd700', count: 30, speed: 0.8 },
        xpMode: { type: 'snow', color: '#ffffff', count: 20, speed: 1 },
        sakuraMode: { type: 'sakura', color: '#ffb7c5', count: 40, speed: 1.2 },
        cyberHacker: { type: 'matrix', color: '#00ff00', count: 60, speed: 2 },
        vaporwaveMode: { type: 'neon', color: '#ff71ce', count: 30, speed: 1.2 },
        vestaMode: { type: 'snow', color: '#ff4b2b', count: 35, speed: 1.5 },
        hollowMode: { type: 'snow', color: '#a0a0a0', count: 25, speed: 0.3 },
        blueprintMode: { type: 'dots', color: '#00ffff', count: 40, speed: 0.2 },
        glitchMode: { type: 'matrix', color: '#ff0000', count: 50, speed: 3 },
        bloodMoon: { type: 'snow', color: '#ff0000', count: 40, speed: 0.7 },
        oledMode: { type: 'dots', color: '#333333', count: 10, speed: 0.2 },
        developerMode: { type: 'matrix', color: '#7cfc00', count: 30, speed: 1 },
        yandereMode: { type: 'sakura', color: '#8b0000', count: 30, speed: 1.5 },
        pirraMode: { type: 'dots', color: '#FFCC00', count: 40, speed: 1.5 },
        mobyMode: { type: 'whale', color: '#ffffff', count: 8, speed: 1.2 }
    },


    init() {
        // Check if user disabled particles
        const saved = localStorage.getItem('animeengine_particles');
        if (saved === 'false') {
            this.enabled = false;
            return;
        }

        this.createCanvas();
        this.setTheme(Themes?.currentTheme || 'default');
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.resize());

        console.log('✨ Particles initialized');
    },

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.6;
        `;
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    setTheme(themeName) {
        this.currentTheme = themeName;
        const config = this.themes[themeName] || this.themes.default;
        this.particles = [];

        for (let i = 0; i < config.count; i++) {
            this.particles.push(this.createParticle(config));
        }
    },

    createParticle(config) {
        const x = Math.random() * (this.canvas?.width || window.innerWidth);
        const y = Math.random() * (this.canvas?.height || window.innerHeight);

        return {
            x,
            y,
            size: Math.random() * 8 + 4,
            speedX: (Math.random() - 0.5) * config.speed,
            speedY: Math.random() * config.speed + 0.5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
            opacity: Math.random() * 0.5 + 0.3,
            color: config.color,
            type: config.type,
            // For matrix effect
            char: String.fromCharCode(0x30A0 + Math.random() * 96),
            trail: [],
            // Whale specific
            tailAngle: 0,
            mouthOpen: 0
        };
    },

    animate() {
        if (!this.enabled || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const config = this.themes[this.currentTheme] || this.themes.default;

        this.particles.forEach(p => {
            this.updateParticle(p, config);
            this.drawParticle(p);
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    updateParticle(p, config) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around screen
        if (p.y > this.canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * this.canvas.width;
        }
        if (p.x > this.canvas.width + 100) p.x = -100;
        if (p.x < -100) p.x = this.canvas.width + 100;

        // Whale animation
        if (p.type === 'whale') {
            p.tailAngle = Math.sin(Date.now() / 500) * 0.3;
            p.mouthOpen = (Math.sin(Date.now() / 1000) + 1) * 0.1;
            p.speedY = Math.sin(p.x / 100) * 0.5; // Slight wave motion
        }

        // Matrix trail
        if (p.type === 'matrix') {
            p.trail.push({ x: p.x, y: p.y, char: p.char, opacity: 1 });
            if (p.trail.length > 15) p.trail.shift();
            p.trail.forEach(t => t.opacity *= 0.9);

            // Random char change
            if (Math.random() < 0.05) {
                p.char = String.fromCharCode(0x30A0 + Math.random() * 96);
            }
        }
    },

    drawParticle(p) {
        this.ctx.save();

        switch (p.type) {
            case 'sakura':
                this.drawSakura(p);
                break;
            case 'snow':
                this.drawSnow(p);
                break;
            case 'neon':
                this.drawNeon(p);
                break;
            case 'matrix':
                this.drawMatrix(p);
                break;
            case 'dots':
                this.drawDots(p);
                break;
            case 'whale':
                this.drawWhale(p);
                break;
        }

        this.ctx.restore();
    },

    drawSakura(p) {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.globalAlpha = p.opacity;

        // Petal shape
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Second petal
        this.ctx.rotate(Math.PI / 3);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.8, p.size / 2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawSnow(p) {
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawNeon(p) {
        this.ctx.globalAlpha = p.opacity * 0.8;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = p.color;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner glow
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawMatrix(p) {
        // Draw trail
        p.trail.forEach((t, i) => {
            this.ctx.globalAlpha = t.opacity * 0.3;
            this.ctx.fillStyle = p.color;
            this.ctx.font = `${p.size}px monospace`;
            this.ctx.fillText(t.char, t.x, t.y);
        });

        // Draw main char
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.font = `bold ${p.size}px monospace`;
        this.ctx.fillText(p.char, p.x, p.y);
    },

    drawDots(p) {
        this.ctx.globalAlpha = p.opacity * 0.3;
        this.ctx.fillStyle = p.color;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 3, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawWhale(p) {
        this.ctx.translate(p.x, p.y);
        // Whales swim horizontally, flip based on speedX
        if (p.speedX < 0) this.ctx.scale(-1, 1);
        
        this.ctx.globalAlpha = p.opacity * 0.4;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = p.color;

        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Tail
        this.ctx.save();
        this.ctx.translate(-p.size * 1.8, 0);
        this.ctx.rotate(p.tailAngle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-p.size, -p.size);
        this.ctx.lineTo(-p.size, p.size);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Fin
        this.ctx.beginPath();
        this.ctx.ellipse(0, p.size * 0.5, p.size * 0.5, p.size * 0.8, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(p.size * 1.2, -p.size * 0.2, p.size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('animeengine_particles', this.enabled);

        if (this.enabled) {
            if (!this.canvas) this.createCanvas();
            this.setTheme(this.currentTheme);
            this.animate();
        } else {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.canvas) {
                this.canvas.remove();
                this.canvas = null;
            }
        }

        return this.enabled;
    },

    isEnabled() {
        return this.enabled;
    }
};

window.Particles = Particles;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => Particles.init(), 500);
});

