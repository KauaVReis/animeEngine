<?php
/**
 * AnimeEngine v8 - View: Register
 * Interface de cadastro Neo-Brutalista integrada ao Front Controller
 */
?>

<div class="auth-fullscreen-layout">
    <div class="auth-card-neo">
        <!-- HEADER / LOGO -->
        <div class="auth-card-header">
            <div class="auth-badge">NOVO REGISTRO</div>
            <h1 class="auth-logo-title">ANIME<span class="highlight">.ENGINE</span></h1>
            <p class="auth-subtitle">Crie sua conta para acompanhar seus animes, estatísticas e títulos</p>
        </div>

        <!-- MENSAGEM / FEEDBACK -->
        <div class="auth-message-box" id="message" role="alert" style="display: none;"></div>

        <!-- FORMULÁRIO -->
        <form class="auth-form-neo" id="register-form" novalidate>
            <div class="auth-input-group">
                <label for="username" class="auth-label">
                    <i class="fas fa-user"></i> Nome de Usuário
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        required 
                        autocomplete="username" 
                        placeholder="Ex: SpikeSpiegel" 
                        class="auth-input"
                    >
                </div>
            </div>

            <div class="auth-input-group">
                <label for="email" class="auth-label">
                    <i class="fas fa-envelope"></i> E-mail
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        autocomplete="email" 
                        placeholder="seu@email.com" 
                        class="auth-input"
                    >
                </div>
            </div>

            <div class="auth-input-group">
                <label for="senha" class="auth-label">
                    <i class="fas fa-lock"></i> Senha (mínimo 6 dígitos)
                </label>
                <div class="auth-input-wrapper has-toggle">
                    <input 
                        type="password" 
                        id="senha" 
                        name="senha" 
                        required 
                        autocomplete="new-password" 
                        placeholder="••••••••" 
                        class="auth-input"
                    >
                    <button type="button" class="auth-password-toggle" id="toggle-reg-password" aria-label="Mostrar/ocultar senha">
                        <i class="fas fa-eye" id="toggle-reg-icon"></i>
                    </button>
                </div>
            </div>

            <div class="auth-input-group">
                <label for="confirmar" class="auth-label">
                    <i class="fas fa-shield-alt"></i> Confirmar Senha
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="password" 
                        id="confirmar" 
                        name="confirmar" 
                        required 
                        autocomplete="new-password" 
                        placeholder="••••••••" 
                        class="auth-input"
                    >
                </div>
            </div>

            <button type="submit" class="auth-submit-btn" id="submit-btn">
                <i class="fas fa-user-plus"></i>
                <span>CRIAR MINHA CONTA</span>
            </button>
        </form>

        <!-- RODAPÉ DE LINKS -->
        <div class="auth-footer-links">
            <p class="auth-register-prompt">
                Já possui uma conta? <a href="login" class="auth-link-bold">Fazer login</a>
            </p>
            <div class="auth-divider"></div>
            <a href="home" class="auth-back-link">
                <i class="fas fa-arrow-left"></i> Voltar para a Página Inicial
            </a>
        </div>
    </div>
</div>

<style>
/* REAPROVEITA ESTILOS NEO-BRUTALISTAS DE AUTH */
.auth-fullscreen-layout {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: radial-gradient(circle at 50% 30%, rgba(255, 51, 102, 0.08) 0%, rgba(13, 13, 18, 0.98) 70%);
}

.auth-card-neo {
    width: 100%;
    max-width: 440px;
    background: var(--color-surface, #1e1e24);
    border: 4px solid var(--border-color, #000);
    box-shadow: 8px 8px 0px var(--border-color, #000);
    border-radius: 8px;
    padding: 36px 32px;
    animation: authCardEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-card-header {
    text-align: center;
    margin-bottom: 24px;
}

.auth-badge {
    display: inline-block;
    background: var(--color-primary, #ff3366);
    color: #ffffff;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 4px 12px;
    border: 2px solid var(--border-color, #000);
    box-shadow: 2px 2px 0px var(--border-color, #000);
    border-radius: 4px;
    margin-bottom: 12px;
}

.auth-logo-title {
    font-family: 'Archivo Black', sans-serif;
    font-size: 2.2rem;
    line-height: 1.1;
    color: var(--color-text, #ffffff);
    margin: 0 0 8px;
    letter-spacing: -0.5px;
}

.auth-logo-title .highlight {
    color: var(--color-primary, #ff3366);
}

.auth-subtitle {
    font-size: 0.88rem;
    color: var(--color-text-muted, #9ca3af);
    line-height: 1.4;
    margin: 0;
}

.auth-message-box {
    padding: 12px 16px;
    border: 3px solid #000;
    box-shadow: 4px 4px 0px #000;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 20px;
    border-radius: 4px;
    text-align: center;
}

.auth-message-box.error {
    background: #ef4444;
    color: #ffffff;
}

.auth-message-box.success {
    background: #10b981;
    color: #ffffff;
}

.auth-form-neo {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.auth-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.auth-label {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 800;
    font-size: 0.82rem;
    color: var(--color-text, #ffffff);
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.auth-label i {
    color: var(--color-primary, #ff3366);
}

.auth-input-wrapper {
    position: relative;
    width: 100%;
}

.auth-input {
    width: 100%;
    padding: 12px 14px;
    background: var(--color-bg, #121218);
    color: var(--color-text, #ffffff) !important;
    border: 3px solid var(--border-color, #000);
    box-shadow: 3px 3px 0px var(--border-color, #000);
    border-radius: 4px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.15s ease;
    box-sizing: border-box;
}

.auth-input:focus {
    outline: none;
    border-color: var(--color-primary, #ff3366);
    box-shadow: 5px 5px 0px var(--border-color, #000);
    background: #15151e;
}

.auth-input-wrapper.has-toggle .auth-input {
    padding-right: 48px;
}

.auth-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--color-text-muted, #9ca3af);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-password-toggle:hover {
    color: var(--color-primary, #ff3366);
}

.auth-submit-btn {
    width: 100%;
    padding: 15px 20px;
    background: var(--color-primary, #ff3366);
    color: #ffffff;
    border: 3px solid var(--border-color, #000);
    box-shadow: 4px 4px 0px var(--border-color, #000);
    border-radius: 4px;
    font-family: 'Archivo Black', sans-serif;
    font-size: 1.05rem;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 8px;
}

.auth-submit-btn:hover:not(:disabled) {
    background: #e62055;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px var(--border-color, #000);
}

.auth-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.auth-footer-links {
    margin-top: 22px;
    text-align: center;
}

.auth-register-prompt {
    font-size: 0.92rem;
    color: var(--color-text-muted, #9ca3af);
    margin: 0;
}

.auth-link-bold {
    color: var(--color-primary, #ff3366);
    font-weight: 800;
    text-decoration: none;
    border-bottom: 2px solid var(--color-primary, #ff3366);
}

.auth-divider {
    height: 2px;
    background: var(--border-color, rgba(255, 255, 255, 0.1));
    margin: 16px auto;
    width: 60%;
}

.auth-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
}
</style>

<script>
(function() {
    // Toggle visibilidade da senha
    const toggleBtn = document.getElementById('toggle-reg-password');
    const pwdInput = document.getElementById('senha');
    const toggleIcon = document.getElementById('toggle-reg-icon');

    if (toggleBtn && pwdInput) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isPassword = pwdInput.type === 'password';
            pwdInput.type = isPassword ? 'text' : 'password';
            toggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const message = document.getElementById('message');

            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const confirmar = document.getElementById('confirmar').value;

            if (senha !== confirmar) {
                message.className = 'auth-message-box error';
                message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> As senhas digitadas não coincidem';
                message.style.display = 'block';
                return;
            }

            if (senha.length < 6) {
                message.className = 'auth-message-box error';
                message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> A senha deve conter pelo menos 6 caracteres';
                message.style.display = 'block';
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>REGISTRANDO...</span>';

            try {
                const response = await fetch('api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, senha })
                });

                const data = await response.json();

                if (data.success) {
                    message.className = 'auth-message-box success';
                    message.innerHTML = '<i class="fas fa-check-circle"></i> ' + (data.message || 'Conta criada com sucesso! Redirecionando...');
                    message.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = 'login';
                    }, 1200);
                } else {
                    message.className = 'auth-message-box error';
                    message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + (data.message || 'Erro ao registrar conta');
                    message.style.display = 'block';

                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-plus"></i><span>CRIAR MINHA CONTA</span>';
                }
            } catch (error) {
                message.className = 'auth-message-box error';
                message.innerHTML = '<i class="fas fa-times-circle"></i> Falha de comunicação com o servidor';
                message.style.display = 'block';

                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-plus"></i><span>CRIAR MINHA CONTA</span>';
            }
        });
    }
})();
</script>
