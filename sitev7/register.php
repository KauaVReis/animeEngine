<?php
require_once __DIR__ . '/includes/csrf.php';
$csrf_token = htmlspecialchars(getCsrfToken(), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= $csrf_token ?>">
    <title>Criar Conta - ANIME.ENGINE v7</title>
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/v6_styles.css">
    <style>
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #0d0d12 0%, #1a1a24 100%);
        }
        
        .auth-box {
            background: var(--color-surface);
            border: 3px solid var(--border-color);
            box-shadow: var(--shadow-neo);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        
        .auth-logo {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .auth-logo h1 {
            font-family: 'Archivo Black', sans-serif;
            font-size: 2rem;
            color: var(--color-primary);
        }
        
        .auth-logo span {
            font-size: 0.9rem;
            color: var(--color-text-muted);
        }
        
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .form-group input {
            padding: 12px 15px;
            border: 2px solid var(--border-color);
            background: var(--color-bg);
            font-size: 1rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--color-primary);
        }
        
        .form-hint {
            font-size: 0.75rem;
            color: var(--color-text-muted);
        }
        
        .auth-btn {
            padding: 15px;
            background: var(--color-primary);
            color: white;
            border: none;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .auth-btn:hover {
            background: var(--color-secondary);
            transform: translateY(-2px);
        }
        
        .auth-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .auth-links {
            text-align: center;
            margin-top: 20px;
        }
        
        .auth-links a {
            color: var(--color-primary);
            text-decoration: none;
        }
        
        .auth-links a:hover {
            text-decoration: underline;
        }
        
        .auth-message {
            padding: 10px 15px;
            border: 2px solid;
            text-align: center;
            display: none;
        }
        
        .auth-message.error {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
            color: #ef4444;
        }
        
        .auth-message.success {
            background: rgba(34, 197, 94, 0.1);
            border-color: #22c55e;
            color: #22c55e;
        }

        .password-strength {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-top: 4px;
        }

        .password-strength span {
            height: 6px;
            background: rgba(148, 163, 184, 0.35);
            border: 1px solid var(--border-color);
        }

        .password-strength[data-score="1"] span:nth-child(-n+1) { background: #ef4444; }
        .password-strength[data-score="2"] span:nth-child(-n+2) { background: #f59e0b; }
        .password-strength[data-score="3"] span:nth-child(-n+3) { background: #3b82f6; }
        .password-strength[data-score="4"] span:nth-child(-n+4) { background: #22c55e; }

        .field-feedback {
            min-height: 16px;
            font-size: 0.75rem;
            color: var(--color-text-muted);
        }

        .field-feedback.error { color: #ef4444; }
        .field-feedback.success { color: #22c55e; }
    </style>
</head>
<body class="page-ready">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-logo">
                <h1>ANIME.ENGINE</h1>
                <span>v7 // Criar Conta</span>
            </div>
            
            <div class="auth-message" id="message"></div>
            
            <form class="auth-form" id="register-form">
                <div class="form-group">
                    <label for="username">Nome de Usuário</label>
                    <input type="text" id="username" name="username" required 
                           placeholder="seu_username" pattern="[a-zA-Z0-9_]+" minlength="3" maxlength="50">
                    <span class="form-hint">Apenas letras, números e underscore</span>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="seu@email.com">
                </div>
                
                <div class="form-group">
                    <label for="senha">Senha</label>
                    <input type="password" id="senha" name="senha" required placeholder="••••••••" minlength="6">
                    <div class="password-strength" id="password-strength" data-score="0" aria-hidden="true">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span class="field-feedback" id="password-feedback">Mínimo 6 caracteres</span>
                </div>
                
                <div class="form-group">
                    <label for="confirmar">Confirmar Senha</label>
                    <input type="password" id="confirmar" name="confirmar" required placeholder="••••••••">
                    <span class="field-feedback" id="confirm-feedback"></span>
                </div>
                
                <button type="submit" class="auth-btn" id="submit-btn">
                    <i class="fas fa-user-plus"></i> Criar Conta
                </button>
            </form>
            
            <div class="auth-links">
                <p>Já tem conta? <a href="login.php">Fazer login</a></p>
                <p style="margin-top: 10px;"><a href="index.php">← Voltar para o site</a></p>
            </div>
        </div>
    </div>
    
    <script>
        const senhaInput = document.getElementById('senha');
        const confirmarInput = document.getElementById('confirmar');
        const strength = document.getElementById('password-strength');
        const passwordFeedback = document.getElementById('password-feedback');
        const confirmFeedback = document.getElementById('confirm-feedback');

        function scorePassword(value) {
            let score = 0;
            if (value.length >= 6) score++;
            if (value.length >= 10) score++;
            if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
            if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score++;
            return Math.min(score, 4);
        }

        function updatePasswordFeedback() {
            const score = scorePassword(senhaInput.value);
            strength.dataset.score = String(score);

            const labels = ['Mínimo 6 caracteres', 'Senha fraca', 'Senha ok', 'Senha boa', 'Senha forte'];
            passwordFeedback.textContent = labels[score];
            passwordFeedback.className = `field-feedback ${score >= 3 ? 'success' : score > 0 ? 'error' : ''}`;

            if (confirmarInput.value) {
                const matches = senhaInput.value === confirmarInput.value;
                confirmFeedback.textContent = matches ? 'Senhas conferem' : 'As senhas não coincidem';
                confirmFeedback.className = `field-feedback ${matches ? 'success' : 'error'}`;
            }
        }

        senhaInput.addEventListener('input', updatePasswordFeedback);
        confirmarInput.addEventListener('input', updatePasswordFeedback);

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const message = document.getElementById('message');
            const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const confirmar = document.getElementById('confirmar').value;
            
            // Validar senhas iguais
            if (senha !== confirmar) {
                message.className = 'auth-message error';
                message.textContent = 'As senhas não coincidem';
                message.style.display = 'block';
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
            
            try {
                const response = await fetch('api/auth/register.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ username, email, senha })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    message.className = 'auth-message success';
                    message.textContent = data.message + ' Redirecionando...';
                    message.style.display = 'block';
                    
                    // Redirecionar para login
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 1500);
                } else {
                    message.className = 'auth-message error';
                    message.textContent = data.message;
                    message.style.display = 'block';
                    
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
                }
            } catch (error) {
                message.className = 'auth-message error';
                message.textContent = 'Erro de conexão. Tente novamente.';
                message.style.display = 'block';
                
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
            }
        });
    </script>
</body>
</html>
