/**
 * AnimeEngine v6 - Timeline Feature
 * Visualizes franchise relations.
 */

const Timeline = {
    render(containerId, relations) {
        const container = document.getElementById(containerId);
        if (!container || !relations || !relations.edges || relations.edges.length === 0) return;

        // Show container
        container.style.display = 'block';
        
        container.innerHTML = '<h2 class="section-title"><i class="fas fa-project-diagram"></i> Timeline da Franquia</h2>';
        
        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'timeline-wrapper';

        // Filter valid relations (Sequel, Prequel, Spin_off, Parent, Side_story)
        const relevantTypes = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'SOURCE'];
        const edges = relations.edges.filter(e => relevantTypes.includes(e.relationType));

        if (edges.length === 0) return;

        edges.forEach(edge => {
            const node = edge.node;
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            // Format relation type
            const typeLabel = edge.relationType.replace('_', ' ').toLowerCase();

            item.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <span class="timeline-type">${typeLabel}</span>
                    <div class="timeline-card" onclick="window.location.href='detalhes.php?id=${node.id}'">
                        <img src="${node.coverImage.medium}" alt="${node.title.romaji}">
                        <div class="timeline-info">
                            <div class="timeline-title">${node.title.romaji}</div>
                            <div class="timeline-meta">${node.format} • ${node.status}</div>
                        </div>
                    </div>
                </div>
            `;
            timelineWrapper.appendChild(item);
        });

        container.appendChild(timelineWrapper);
    }
};

