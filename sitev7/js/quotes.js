/**
 * AnimeEngine v6 - Famous Anime Quotes
 * Citações famosas de animes
 */

const Quotes = {
    quotes: [
        // Naruto
        { text: "Eu não volto atrás na minha palavra. Esse é o meu jeito ninja!", character: "Naruto Uzumaki", anime: "Naruto" },
        { text: "A solidão é muito mais dolorosa do que ser ferido.", character: "Gaara", anime: "Naruto" },
        { text: "Quando as pessoas são protegidas por alguém que amam, elas se tornam mais fortes.", character: "Haku", anime: "Naruto" },
        
        // One Piece
        { text: "Eu vou me tornar o Rei dos Piratas!", character: "Monkey D. Luffy", anime: "One Piece" },
        { text: "Quando você quer proteger algo, seus punhos ficam mais fortes!", character: "Roronoa Zoro", anime: "One Piece" },
        { text: "Os homens que não podem abandonar nada, não podem mudar nada.", character: "Erwin Smith", anime: "One Piece" },
        { text: "Ninguém nasce neste mundo completamente sozinho.", character: "Saul", anime: "One Piece" },
        
        // Attack on Titan
        { text: "Se você não lutar, você não pode vencer!", character: "Eren Yeager", anime: "Attack on Titan" },
        { text: "O mundo é cruel, mas também é muito bonito.", character: "Mikasa Ackerman", anime: "Attack on Titan" },
        { text: "Dedique seu coração!", character: "Erwin Smith", anime: "Attack on Titan" },
        
        // Death Note
        { text: "Eu sou a justiça!", character: "Light Yagami", anime: "Death Note" },
        { text: "Se você usa sua cabeça, você pode ter tudo neste mundo.", character: "L", anime: "Death Note" },
        
        // Demon Slayer
        { text: "Eu sou a água que flui e se adapta.", character: "Tanjiro Kamado", anime: "Demon Slayer" },
        { text: "Nunca desista, não importa o quão forte seja o inimigo.", character: "Kyojuro Rengoku", anime: "Demon Slayer" },
        { text: "Coloque seu coração em chamas!", character: "Kyojuro Rengoku", anime: "Demon Slayer" },
        
        // My Hero Academia
        { text: "Um herói é alguém que ultrapassa os limites.", character: "All Might", anime: "My Hero Academia" },
        { text: "Você também pode se tornar um herói!", character: "All Might", anime: "My Hero Academia" },
        { text: "Está tudo bem agora! Por quê? Porque eu estou aqui!", character: "All Might", anime: "My Hero Academia" },
        
        // Dragon Ball
        { text: "Eu sou o Super Saiyajin, Son Goku!", character: "Goku", anime: "Dragon Ball Z" },
        { text: "O orgulho de um Saiyajin não permite derrota!", character: "Vegeta", anime: "Dragon Ball Z" },
        
        // Fullmetal Alchemist
        { text: "Uma lição sem dor não tem significado.", character: "Edward Elric", anime: "Fullmetal Alchemist" },
        { text: "Levante-se e ande. Você tem pernas.", character: "Edward Elric", anime: "Fullmetal Alchemist" },
        { text: "Os humanos são criaturas estúpidas que pensam que podem fazer qualquer coisa.", character: "Father", anime: "Fullmetal Alchemist" },
        
        // Jujutsu Kaisen
        { text: "Eu morrerei cercado de pessoas que amo!", character: "Yuji Itadori", anime: "Jujutsu Kaisen" },
        { text: "Você é forte porque é gentil.", character: "Gojo Satoru", anime: "Jujutsu Kaisen" },
        { text: "Ao longo dos céus e sob os céus, eu sozinho sou o honrado.", character: "Gojo Satoru", anime: "Jujutsu Kaisen" },
        
        // Sword Art Online
        { text: "No mundo real ou no virtual, eu sempre serei eu mesmo.", character: "Kirito", anime: "Sword Art Online" },
        
        // Steins;Gate
        { text: "El Psy Kongroo.", character: "Okabe Rintaro", anime: "Steins;Gate" },
        { text: "O universo tem um começo, mas não tem fim. Infinito.", character: "Okabe Rintaro", anime: "Steins;Gate" },
        
        // Hunter x Hunter
        { text: "Você deveria aproveitar as pequenas coisas da vida.", character: "Gon Freecss", anime: "Hunter x Hunter" },
        { text: "Os humanos são criaturas interessantes.", character: "Meruem", anime: "Hunter x Hunter" },
        
        // Code Geass
        { text: "Se o rei não lidera, como pode esperar que seus subordinados o sigam?", character: "Lelouch", anime: "Code Geass" },
        { text: "A única pois que importa é destruir e criar.", character: "Lelouch", anime: "Code Geass" },
        
        // Tokyo Ghoul
        { text: "O que está errado não sou eu... é o mundo!", character: "Ken Kaneki", anime: "Tokyo Ghoul" },
        
        // Evangelion
        { text: "Eu não vou fugir!", character: "Shinji Ikari", anime: "Neon Genesis Evangelion" },
        
        // Cowboy Bebop
        { text: "Adeus, Space Cowboy.", character: "Narrador", anime: "Cowboy Bebop" },
        { text: "O passado é o passado. Não pode ser mudado.", character: "Spike Spiegel", anime: "Cowboy Bebop" },
        
        // Bleach
        { text: "Se você não desabafar às vezes, você vai sufocar.", character: "Ichigo Kurosaki", anime: "Bleach" },
        { text: "Abandonar a luta é pior que perder.", character: "Ichigo Kurosaki", anime: "Bleach" },
        
        // Spy x Family
        { text: "Waku waku!", character: "Anya Forger", anime: "Spy x Family" },
        
        // Mob Psycho 100
        { text: "Os seus poderes são apenas parte de você. Você é muito mais.", character: "Reigen Arataka", anime: "Mob Psycho 100" },
        
        // Chainsaw Man
        { text: "Eu quero abraçar uma garota!", character: "Denji", anime: "Chainsaw Man" },
        
        // Violet Evergarden
        { text: "Eu quero saber o que é 'eu te amo'.", character: "Violet Evergarden", anime: "Violet Evergarden" },
        
        // Your Name
        { text: "Não importa onde você está no mundo, eu vou te encontrar.", character: "Taki Tachibana", anime: "Kimi no Na wa" }
    ],
    
    /**
     * Get a random quote
     */
    getRandom() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    },
    
    /**
     * Get quote of the day (same quote for entire day)
     */
    getQuoteOfDay() {
        const today = new Date().toDateString();
        const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const index = seed % this.quotes.length;
        return this.quotes[index];
    },
    
    /**
     * Get quote by anime name
     */
    getByAnime(animeName) {
        return this.quotes.filter(q => 
            q.anime.toLowerCase().includes(animeName.toLowerCase())
        );
    },
    
    /**
     * Render quote widget HTML
     */
    renderWidget() {
        const quote = this.getQuoteOfDay();
        return `
            <div class="quote-widget">
                <div class="quote-icon">💬</div>
                <blockquote class="quote-text">"${quote.text}"</blockquote>
                <div class="quote-author">
                    <span class="quote-character">— ${quote.character}</span>
                    <span class="quote-anime">${quote.anime}</span>
                </div>
            </div>
        `;
    }
};

window.Quotes = Quotes;

