# 🚀 Plano de Melhorias Detalhado: AnimeEngine v8
> Versão Revisada e Atualizada com Melhorias de Segurança

---

## 1. Arquitetura SPA & Sistema de Rotas (Front Controller)

A mudança mais significativa na operação do site. O AnimeEngine deixará de carregar páginas inteiras e passará a funcionar como um aplicativo nativo, gerenciando o histórico do navegador via JavaScript.

- **Front Controller (`index.php`)**: Único ponto de entrada na raiz atuando como Router global.
- **Views Limpas**: A pasta `views/` conterá apenas o HTML do conteúdo principal (sem `<html>`, `<head>` ou `<body>`).
- **History API**: Uso de `window.history.pushState()` para manter URLs amigáveis e o funcionamento do botão "Voltar".
- **Performance**: Requisições via `fetch()` buscando apenas o "miolo" da página através da flag `ajax=true`.

> 💡 **UX Premium**: Implementação de transições suaves (fade in/out) e *skeleton screens* para eliminar o "piscar branco" entre páginas.

---

## 2. Refatoração de Banco de Dados e Segurança

Reescrita completa da camada de dados para garantir proteção máxima e performance.

### 🛡️ Regras de Ouro

1. **Fim do PDO**: Uso exclusivo do driver **mysqli**.
2. **Prepared Statements (Blind Params)**: Proibida a concatenação de variáveis em queries. O uso de `bind_param` é obrigatório.
3. **Wrapper Seguro**: Criação de uma função central no `database.php` para forçar queries parametrizadas.

### ⚡ Otimização do Perfil

- Eliminação do problema de **N+1 queries** utilizando `JOINs` eficientes.
- Cache inteligente de estatísticas e streaks para reduzir carga no servidor.

---

## 3. Segurança Web (Camada Adicional — NOVO)

Esta seção cobre as proteções essenciais que vão além do banco de dados, cobrindo ameaças comuns em aplicações web modernas.

### 3.1 Configuração do `.htaccess`

O arquivo `.htaccess` é o guardião da aplicação no servidor Apache. Ele deve ser configurado para:

- Redirecionar todas as requisições para `index.php` (essencial para o Front Controller funcionar).
- Bloquear acesso direto à pasta `views/` — sem isso, qualquer usuário pode acessar fragmentos de HTML diretamente.
- Adicionar Headers HTTP de segurança em todas as respostas.

**Estrutura base do `.htaccess`:**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Bloqueia acesso direto às views fragmentadas
<Files ~ "\.php$">
    <Directory "v8/views">
        Deny from all
    </Directory>
</Files>

# Headers de segurança
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
```

### 3.2 Proteção contra XSS (Cross-Site Scripting)

Com a SPA injetando HTML dinamicamente via `fetch()`, o risco de XSS aumenta consideravelmente. Regras obrigatórias:

- **Nunca usar `innerHTML`** com dados vindos do servidor sem sanitização prévia.
- Usar `textContent` para inserir texto puro, ou **DOMPurify** para HTML confiável.
- No PHP, usar `htmlspecialchars()` em todo output refletido ao usuário.

### 3.3 Proteção CSRF (Cross-Site Request Forgery)

Todo formulário que altera dados (adicionar anime, editar perfil, etc.) precisa de um token CSRF para impedir requisições forjadas por sites maliciosos.

- Gerar token único por sessão no PHP e incluir em formulários como campo oculto.
- Validar o token em todos os endpoints `POST` da pasta `api/`.
- Usar `SameSite=Strict` nos cookies de sessão.

### 3.4 Autenticação e Sessões Seguras

- Regenerar `session_id` após login (`session_regenerate_id(true)`) para prevenir Session Fixation.
- Configurar cookies com `Secure`, `HttpOnly` e `SameSite=Strict`.
- Definir timeout de sessão para logout automático por inatividade.

### 3.5 Rate Limiting nos Endpoints da API

Os endpoints em `api/` ficam expostos a abusos em uma arquitetura SPA. Implementar:

- Limite de requisições por IP e por usuário autenticado.
- Retornar HTTP `429 Too Many Requests` quando o limite for excedido.
- Registrar tentativas suspeitas em log para auditoria.

### 3.6 Headers HTTP de Segurança

| Header | Proteção Oferecida |
| :--- | :--- |
| `X-Frame-Options: DENY` | Impede que o site seja embutido em iframes (Clickjacking) |
| `X-Content-Type-Options: nosniff` | Impede que o browser interprete arquivos incorretamente |
| `Content-Security-Policy` | Define quais fontes de scripts/estilos são permitidas |
| `Referrer-Policy: no-referrer` | Não vaza a URL atual para sites externos |
| `Permissions-Policy` | Desativa recursos como câmera/mic que o site não usa |

---

## 4. Modularização do CSS

Fragmentação do arquivo central (atualmente com +11k linhas) para melhorar o *Critical Rendering Path*.

### 📂 Nova Estrutura de Pastas

```text
v8/css/
├── base/         # variables.css, reset.css, typography.css
├── themes/       # themes.css (cores dinâmicas via data-theme)
├── layout/       # header.css, footer.css, grid-system.css
├── components/   # anime-card.css, buttons.css, modals.css
└── pages/        # perfil.css, explorar.css (carregados sob demanda)
```

- **Injeção Dinâmica**: O servidor incluirá apenas o CSS necessário para a página atual.
- **Temas**: Seletores de atributos (`[data-theme="dark"]`) para trocas de cor instantâneas.

---

## 5. Modularização do JavaScript (ES6 Modules)

Limpeza do escopo global e isolamento de lógica para evitar conflitos.

### 📂 Estrutura de Módulos

```text
v8/js/
├── core/         # spa-router.js, api-client.js, storage.js
├── services/     # achievements.js, goals.js, animedata.js
├── components/   # ost-player.js, notifications.js, roulette.js
├── utils/        # translation.js, dom-helpers.js
└── app.js        # Entry-point principal (type="module")
```

- **API Client**: Centralização de todos os `fetch()` em um wrapper único com tratamento de erros padronizado.

---

## 6. Benefícios para o Usuário

| Recurso | Benefício UX |
| :--- | :--- |
| **OST Player** | Música contínua durante a navegação entre páginas. |
| **Navegação "Manteiga"** | Transições fluidas sem recarregamento visual brusco. |
| **Economia de Dados** | Menor consumo de banda, ideal para navegação mobile. |
| **Estabilidade** | Erros em módulos isolados não derrubam o site inteiro. |
| **Proteção CSRF** | Formulários protegidos contra requisições forjadas. |
| **Headers de Segurança** | Proteção automática no navegador contra XSS e Clickjacking. |

---

## 7. Plano de Ação (Checklist Revisado)

### Fase 1: Fundação
- [ ] Duplicar `sitev7` para `v8`.
- [ ] Implementar `index.php` (Router PHP).
- [ ] Configurar lógica de carregamento condicional (Header/Footer).
- [ ] Criar e configurar `.htaccess` com Rewrite Rules para o Front Controller.
- [ ] Bloquear acesso direto à pasta `v8/views/` via `.htaccess`.

### Fase 2: Estruturação de Views
- [ ] Mover conteúdo `<main>` para `v8/views/`.
- [ ] Adaptar páginas principais (explorar, calculadora, perfil).

### Fase 3: Segurança (Expandida)
- [ ] Refatorar `includes/database.php` para `mysqli`.
- [ ] Criar wrapper `secure_query()` com prepared statements obrigatórios.
- [ ] Auditar e corrigir endpoints da pasta `api/`.
- [ ] Implementar tokens CSRF em todos os formulários de alteração de dados.
- [ ] Validar token CSRF em todos os endpoints `POST` da `api/`.
- [ ] Sanitizar todos os outputs PHP com `htmlspecialchars()`.
- [ ] Configurar sessões seguras: `session_regenerate_id()`, `HttpOnly`, `Secure`, `SameSite=Strict`.
- [ ] Adicionar rate limiting nos endpoints da `api/`.
- [ ] Adicionar Headers HTTP de segurança no `.htaccess`.

### Fase 4: Motor SPA
- [ ] Criar `spa-router.js`.
- [ ] Interceptar cliques em links locais (`e.preventDefault()`).
- [ ] Integrar `pushState` e `popstate`.
- [ ] Implementar sanitização de HTML dinâmico no cliente (DOMPurify ou `textContent`).

### Fase 5: Polimento Visual
- [ ] Migrar estilos para a nova hierarquia modular (`base/`, `themes/`, `layout/`, `components/`, `pages/`).
- [ ] Implementar injeção dinâmica de CSS por página via `index.php`.
- [ ] Extrair variáveis nativas para `base/variables.css` e cores para `themes/themes.css`.
- [ ] Mover blocos de componentes (ex: `.anime-card`) para arquivos individuais e conectar via injeção condicional no `index.php`.
