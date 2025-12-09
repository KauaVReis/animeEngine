/**
 * AnimeEngine v4 - Share Module
 * Gera imagem da Stack para compartilhamento
 */

const Share = {
    /**
     * Gera uma imagem da Stack atual usando Canvas
     */
    async generateStackImage() {
        const playlist = appState.playlist || [];
        
        if (playlist.length === 0) {
            alert('📭 Sua Stack está vazia! Adicione alguns animes primeiro.');
            return null;
        }

        // Configurações do Canvas
        const cardWidth = 600;
        const headerHeight = 120;
        const itemHeight = 80;
        const footerHeight = 60;
        const padding = 20;
        const canvasHeight = headerHeight + (playlist.length * itemHeight) + footerHeight + (padding * 2);

        // Criar Canvas
        const canvas = document.createElement('canvas');
        canvas.width = cardWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Fundo com gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#e0e7ff');
        gradient.addColorStop(1, '#c7d2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cardWidth, canvasHeight);

        // Padrão de pontos
        ctx.fillStyle = 'rgba(165, 180, 252, 0.5)';
        for (let x = 0; x < cardWidth; x += 24) {
            for (let y = 0; y < canvasHeight; y += 24) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Header Box
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        this.drawNeoBox(ctx, padding, padding, cardWidth - (padding * 2), headerHeight - padding, '#fbbf24');
        
        // Título
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px "Archivo Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ANIME.ENGINE', cardWidth / 2, padding + 45);
        
        // Subtítulo
        ctx.font = 'bold 14px "Space Grotesk", sans-serif';
        ctx.fillText(`🎬 MINHA STACK (${playlist.length} animes)`, cardWidth / 2, padding + 75);

        // Lista de Animes
        const listStartY = headerHeight + padding;
        
        for (let i = 0; i < playlist.length; i++) {
            const anime = playlist[i];
            const y = listStartY + (i * itemHeight);
            
            // Box do item
            this.drawNeoBox(ctx, padding, y, cardWidth - (padding * 2), itemHeight - 10, '#ffffff');
            
            // Número
            ctx.fillStyle = '#ec4899';
            ctx.font = 'bold 24px "Archivo Black", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`#${i + 1}`, padding + 15, y + 40);
            
            // Título do Anime
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px "Space Grotesk", sans-serif';
            const title = anime.title.length > 35 ? anime.title.substring(0, 35) + '...' : anime.title;
            ctx.fillText(title, padding + 70, y + 35);
            
            // Episódios
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px "Space Grotesk", sans-serif';
            ctx.fillText(`${anime.episodes || '?'} eps`, padding + 70, y + 55);
        }

        // Footer
        const footerY = listStartY + (playlist.length * itemHeight) + 10;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Feito com ❤️ no ANIME.ENGINE v4', cardWidth / 2, footerY + 20);
        
        // Data
        const date = new Date().toLocaleDateString('pt-BR');
        ctx.fillText(date, cardWidth / 2, footerY + 40);

        return canvas;
    },

    /**
     * Desenha uma caixa Neo-Brutalist
     */
    drawNeoBox(ctx, x, y, width, height, bgColor = '#ffffff') {
        // Sombra
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 4, y + 4, width, height);
        
        // Caixa principal
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);
        
        // Borda
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
    },

    /**
     * Faz download da imagem
     */
    async downloadImage() {
        const canvas = await this.generateStackImage();
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `anime-stack-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Notificação
        this.showNotification('📥 Imagem baixada!');
    },

    /**
     * Copia imagem para o clipboard (se suportado)
     */
    async copyToClipboard() {
        const canvas = await this.generateStackImage();
        if (!canvas) return;

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            this.showNotification('📋 Imagem copiada!');
        } catch (err) {
            console.error('Clipboard API não suportada:', err);
            // Fallback para download
            this.downloadImage();
        }
    },

    /**
     * Abre modal de compartilhamento
     */
    openShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.add('open');
            this.previewImage();
        }
    },

    /**
     * Fecha modal de compartilhamento
     */
    closeShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    },

    /**
     * Gera preview da imagem no modal
     */
    async previewImage() {
        const previewContainer = document.getElementById('share-preview');
        if (!previewContainer) return;

        previewContainer.innerHTML = '<div class="loader"></div>';
        
        const canvas = await this.generateStackImage();
        if (canvas) {
            previewContainer.innerHTML = '';
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            canvas.style.border = '3px solid black';
            canvas.style.boxShadow = '6px 6px 0 black';
            previewContainer.appendChild(canvas);
        } else {
            previewContainer.innerHTML = '<p class="text-gray-500">Stack vazia</p>';
        }
    },

    /**
     * Mostra notificação temporária
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
};

// Expor globalmente
window.Share = Share;
window.openShareModal = () => Share.openShareModal();
window.closeShareModal = () => Share.closeShareModal();
window.downloadStackImage = () => Share.downloadImage();
window.copyStackImage = () => Share.copyToClipboard();
