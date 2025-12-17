<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ANIME.ENGINE v7</title>
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
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-logo">
                <h1>ANIME.ENGINE</h1>
                <span>v7 // Login</span>
            </div>
            
            <div class="auth-message" id="message"></div>
            
            <form class="auth-form" id="login-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="seu@email.com">
                </div>
                
                <div class="form-group">
                    <label for="senha">Senha</label>
                    <input type="password" id="senha" name="senha" required placeholder="••••••••">
                </div>
                
                <button type="submit" class="auth-btn" id="submit-btn">
                    <i class="fas fa-sign-in-alt"></i> Entrar
                </button>
            </form>
            
            <div class="auth-links">
                <p>Não tem conta? <a href="register.php">Criar conta</a></p>
                <p style="margin-top: 10px;"><a href="index.php">← Voltar para o site</a></p>
            </div>
        </div>
    </div>
    
    <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const message = document.getElementById('message');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            try {
                const response = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    message.className = 'auth-message success';
                    message.textContent = data.message;
                    message.style.display = 'block';
                    
                    // Redirecionar após 1 segundo
                    setTimeout(() => {
                        window.location.href = 'index.php';
                    }, 1000);
                } else {
                    message.className = 'auth-message error';
                    message.textContent = data.message;
                    message.style.display = 'block';
                    
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                }
            } catch (error) {
                message.className = 'auth-message error';
                message.textContent = 'Erro de conexão. Tente novamente.';
                message.style.display = 'block';
                
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        });
    </script>
</body>
</html>
