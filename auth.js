// CONFIGURAÇÃO DE USUÁRIOS AUTORIZADOS
const AUTHORIZED_USERS = {
    // Substitua pelos usuários que você quer autorizar
    'Sandro': 'Eu325698',
    'PPD': 'dengue',
    'PPD': 'dengue',
    'PPD': 'dengue',
    'PPD': 'dengue'
    // Adicione mais usuários conforme necessário
};

// CONFIGURAÇÃO
const SESSION_KEY = 'gallery_auth_session';

// VERIFICAR SE JÁ ESTÁ LOGADO - SEM VERIFICAÇÃO DE TEMPO
function checkExistingSession() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            console.log('✅ Sessão válida encontrada');
            redirectToGallery();
            return true;
        } catch (error) {
            console.log('❌ Erro ao ler sessão');
            localStorage.removeItem(SESSION_KEY);
        }
    }
    
    return false;
}

// CRIAR SESSÃO - SEM DATA DE EXPIRAÇÃO
function createSession(username) {
    const sessionData = {
        username: username,
        loginTime: new Date().getTime()
        // Removido: expires
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log(`✅ Sessão permanente criada para: ${username}`);
}

// VALIDAR CREDENCIAIS
function validateCredentials(username, password) {
    return AUTHORIZED_USERS[username] && AUTHORIZED_USERS[username] === password;
}

// MOSTRAR ERRO
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// SIMULAR LOADING
function setLoadingState(loading) {
    const loginBtn = document.querySelector('.login-btn');
    
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// REDIRECIONAR PARA GALERIA
function redirectToGallery() {
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// PROCESSAR LOGIN
async function processLogin(username, password) {
    setLoadingState(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (validateCredentials(username, password)) {
        console.log(`✅ Login bem-sucedido para: ${username}`);
        createSession(username);
        redirectToGallery();
    } else {
        console.log(`❌ Login falhado para: ${username}`);
        setLoadingState(false);
        showError('Nome de usuário ou senha incorretos');
        
        document.getElementById('password').value = '';
        document.getElementById('username').focus();
    }
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de autenticação carregado');
    
    if (checkExistingSession()) {
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }
        
        await processLogin(username, password);
    });
    
    usernameInput.focus();
    
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
});

// FUNÇÕES GLOBAIS PARA GERENCIAMENTO DE SESSÃO

// VERIFICAR SE USUÁRIO ESTÁ AUTENTICADO - SEM VERIFICAÇÃO DE TEMPO
function isAuthenticated() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (!session) return false;
    
    try {
        JSON.parse(session); // Apenas verificar se é válido
        return true;
    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        return false;
    }
}

// FAZER LOGOUT
function logout() {
    localStorage.removeItem(SESSION_KEY);
    console.log('🚪 Logout realizado');
    window.location.href = 'login.html';
}

// OBTER DADOS DA SESSÃO
function getSessionData() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (!session) return null;
    
    try {
        return JSON.parse(session);
    } catch (error) {
        return null;
    }
}

// EXPOR FUNÇÕES GLOBALMENTE
window.isAuthenticated = isAuthenticated;
window.logout = logout;
window.getSessionData = getSessionData;

console.log('🔐 Sistema de autenticação pronto - sessão permanente');
