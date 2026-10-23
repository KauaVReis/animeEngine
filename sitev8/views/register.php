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
