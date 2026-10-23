<?php
/**
 * AnimeEngine v8 - View: Login
 * Interface de autenticação Neo-Brutalista com alta legibilidade e responsividade
 */
?>

<div class="auth-fullscreen-layout">
    <div class="auth-card-neo">
        <!-- HEADER / LOGO -->
        <div class="auth-card-header">
            <div class="auth-badge">ACESSO DE MEMBRO</div>
            <h1 class="auth-logo-title">ANIME<span class="highlight">.ENGINE</span></h1>
            <p class="auth-subtitle">Entre para salvar suas listas, conquistas e ouvir rádios coletivas</p>
        </div>

        <!-- MENSAGEM / FEEDBACK -->
        <div class="auth-message-box" id="message" role="alert" style="display: none;"></div>

        <!-- FORMULÁRIO -->
        <form class="auth-form-neo" id="login-form" novalidate>
            <div class="auth-input-group">
                <label for="email" class="auth-label">
                    <i class="fas fa-envelope"></i> E-mail ou Usuário
                </label>
                <div class="auth-input-wrapper">
                    <input 
                        type="text" 
                        id="email" 
                        name="email" 
                        required 
                        autocomplete="username" 
                        placeholder="seu@email.com" 
                        class="auth-input"
                    >
                </div>
            </div>

            <div class="auth-input-group">
                <div class="auth-label-row">
                    <label for="senha" class="auth-label">
                        <i class="fas fa-lock"></i> Senha
                    </label>
                </div>
                <div class="auth-input-wrapper has-toggle">
                    <input 
                        type="password" 
                        id="senha" 
                        name="senha" 
                        required 
                        autocomplete="current-password" 
                        placeholder="••••••••" 
                        class="auth-input"
                    >
                    <button type="button" class="auth-password-toggle" id="toggle-password" aria-label="Mostrar/ocultar senha">
                        <i class="fas fa-eye" id="toggle-icon"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="auth-submit-btn" id="submit-btn">
                <i class="fas fa-sign-in-alt"></i>
                <span>ACESSAR CONTA</span>
            </button>
        </form>

        <!-- RODAPÉ DE LINKS -->
        <div class="auth-footer-links">
            <p class="auth-register-prompt">
                Não tem uma conta? <a href="register" class="auth-link-bold">Criar conta grátis</a>
            </p>
            <div class="auth-divider"></div>
            <a href="home" class="auth-back-link">
                <i class="fas fa-arrow-left"></i> Voltar para a Página Inicial
            </a>
        </div>
    </div>
</div>

<script>
(function() {
    // Toggle visibilidade da senha
    const toggleBtn = document.getElementById('toggle-password');
    const pwdInput = document.getElementById('senha');
    const toggleIcon = document.getElementById('toggle-icon');

    if (toggleBtn && pwdInput) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isPassword = pwdInput.type === 'password';
            pwdInput.type = isPassword ? 'text' : 'password';
            toggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    // Formulário de Login
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const message = document.getElementById('message');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>VERIFICANDO...</span>';

            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;

            try {
                const response = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const text = await response.text();
                let data;

                try {
                    data = JSON.parse(text);
                } catch (err) {
                    console.error('Resposta bruta da API:', text);
                    throw new Error('Falha no servidor. Tente novamente.');
                }

                if (data.success) {
                    message.className = 'auth-message-box success';
                    message.innerHTML = '<i class="fas fa-check-circle"></i> ' + (data.message || 'Login realizado! Entrando...');
                    message.style.display = 'block';

                    setTimeout(() => {
                        window.location.href = 'home';
                    }, 600);
                } else {
                    message.className = 'auth-message-box error';
                    message.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + (data.message || 'Credenciais inválidas');
                    message.style.display = 'block';

                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>ACESSAR CONTA</span>';
                }
            } catch (error) {
                console.error(error);
                message.className = 'auth-message-box error';
                message.innerHTML = '<i class="fas fa-times-circle"></i> ' + error.message;
                message.style.display = 'block';

                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>ACESSAR CONTA</span>';
            }
        });
    }
})();
</script>
