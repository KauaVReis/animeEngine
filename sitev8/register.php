<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    </style>
</head>
<body>
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
                    <span class="form-hint">Mínimo 6 caracteres</span>
                </div>
                
                <div class="form-group">
                    <label for="confirmar">Confirmar Senha</label>
                    <input type="password" id="confirmar" name="confirmar" required placeholder="••••••••">
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
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submit-btn');
            const message = document.getElementById('message');
            
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
                    headers: { 'Content-Type': 'application/json' },
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
