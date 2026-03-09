# AnimeEngine 🚀

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange)
![Linguagem](https://img.shields.io/badge/PHP-Nativo-blue)
![Banco_de_Dados](https://img.shields.io/badge/MySQL-MariaDB-blue)

**AnimeEngine** é uma plataforma e gerenciador de conteúdo flexível focada em mídias, animes e interação contínua com o usuário. Ela foi projetada com foco em performance, modularidade e em um design arrojado e interativo.

A arquitetura do projeto segue rígidos padrões de segurança e construção de código, fornecendo uma base sólida para uploads, níveis de acesso e consumo de APIs RESTful baseadas em processamento assíncrono.

## ✨ Principais Recursos

- 🛡️ **Sistema de Permissões (ACL):** Controle estrito de acesso a rotas bloqueadas para perfis "Administrador" e "Comum", implementado centralmente através do padrão Singleton em PHP.
- 📁 **Gerenciamento de Mídia Avançado:** Interface visual Drag-and-Drop assíncrona com sanitização rigorosa via Multipart Form-Data (validação estrita de extensão e MIME types).
- ✨ **Design Responsivo e Dinâmico:** Interface premium construída com variáveis globais da instituição (`oklch`), animações de sistema de avisos (Toast), Modais componentizados e layout de Dashboard padrão.
- 🤖 **Integração com ChatBot:** Suporte nato à lógica de conversas orientadas para responder dúvidas de usuários com renderização no frontend.
- 🎮 **Gamificação e Easter Eggs:** Inclusão de lógicas secretas (combinação de botões, horários ou cliques ocultos) implementadas com a lógica de destrancar novos "Temas" ou perfis pela página.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5 Semântico, CSS3 Moderno e JavaScript Vanilla (voltado para interfaces otimizadas com Fetch API e processamentos nativos em lote).
- **Backend:** PHP Nativo baseado no driver `mysqli`. **Proibido o uso da abstração PDO de acordo com o padrão institucional.** 
- **Banco de Dados:** MySQL/MariaDB. A modelagem segue os critérios do Padrão Institucional, com uma base de injeção robusta nas tabelas padrões (`sistema_usuarios`).

## 🚀 Como Executar Localmente

As instruções abaixo formam o guia de inicialização em qualquer ambiente de desenvolvimento com Windows, Mac ou Linux.

### 📋 Pré-requisitos

1. Um servidor de aplicação Web (ex: **XAMPP**, **WAMP**, **MAMP**, ou contêineres Docker usando Apache/Nginx).
2. Servidor de banco de dados nativo rodando (MySQL ou MariaDB).
3. Git instalado no sistema (opcional, para clonagem contínua) e um Navegador Web moderno.

### 🔧 Configuração e Instalação

1. **Clone do Repositório ou Estruturação**
   Copie a pasta principal do projeto para a raiz de hospedagem do seu servidor (por exemplo, na pasta `htdocs/` no XAMPP ou `www/` no WAMP):
   ```bash
   git clone https://github.com/seu-usuario/animeEngine.git
   ```

2. **Configuração do Banco de Dados**
   - Inicie o seu servidor local e o serviço do MySQL;
   - Acesse seu gerenciador do DB (por exemplo, `phpMyAdmin` ou `DBeaver`);
   - Crie o banco de dados correspondente (`db_animeengine_padrao` ou qual preferir);
   - Use o script base (se fornecido na pasta do repositório) para levantar o modelo físico inicial, onde está localizada toda a tabela essencial de permissões.

3. **Arquivos de Conexão Backend**
   Abra os arquivos de conexão localizados nas pastas de APIs ativas (`conexao.php`) e ajuste os parâmetros de conexão host, usuário e senha para refletir o seu ambiente:
   ```php
   <?php
   $host = "localhost";
   $user = "root";       // Geralmente "root" para locais
   $pass = "";           // Sua senha do DB (em branco no XAMPP padrão)
   $db   = "seu_banco";  // Nome do banco criado no Passo 2
   ```

4. **Rodando a Aplicação**
   No seu navegador web, execute a url local com o nome do diretório escolhido onde você descompactou o repositório. Como as versões do site estão particionadas (sitev1 à sitev7, etc), geralmente acessamos as branchs/pastas de release específicas:
   `http://localhost/sua-pasta-local/animeEngine/`

---
> ⚠️ **Nota Tecnológica Institucional**  
> Todo desenvolvimento de interface, backend e regras relativas ao ACL, Login, Banco e Processamento assíncrono em JavaScript se estruturam a partir das lógicas e macros geradas pelo *MCP Senai e Context7*. Nenhuma biblioteca externa excessiva foi requerida onde o padrão requisitou o *Vanilla*.
