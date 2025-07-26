// PWA Registration and Management
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando PWA Manager...');
        
        // Registrar Service Worker
        await this.registerServiceWorker();
        
        // Configurar eventos de instalação
        this.setupInstallPrompt();
        
        // Detectar se já está instalado
        this.detectInstallation();
        
        // Adicionar eventos de conectividade
        this.setupConnectivityEvents();
        
        // Adicionar botão de instalação
        this.addInstallButton();
        
        console.log('✅ PWA Manager inicializado');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);
                
                // Verificar atualizações
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Nova versão disponível');
                    this.handleUpdate(registration);
                });
                
                return registration;
            } catch (error) {
                console.error('❌ Erro ao registrar Service Worker:', error);
            }
        } else {
            console.warn('⚠️ Service Worker não suportado neste navegador');
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('📱 Prompt de instalação disponível');
            event.preventDefault();
            this.deferredPrompt = event;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalado com sucesso');
            this.isInstalled = true;
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }

    detectInstallation() {
        // Detectar se está rodando como PWA
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('📱 Rodando como PWA instalado');
        }
        
        // Detectar em iOS Safari
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 Rodando como PWA no iOS');
        }
    }

    setupConnectivityEvents() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada');
            this.showConnectivityStatus('Conectado', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('📡 Offline - modo cache ativo');
            this.showConnectivityStatus('Modo Offline', 'warning');
        });
    }

    addInstallButton() {
        // Adicionar botão de instalação na tela de login
        const addInstallButtonToPage = () => {
            const loginBox = document.querySelector('.login-box');
            const controlsOverlay = document.getElementById('controls-overlay');
            
            if (loginBox && !document.getElementById('pwa-install-btn')) {
                const installBtn = this.createInstallButton();
                loginBox.appendChild(installBtn);
            } else if (controlsOverlay && !document.getElementById('pwa-install-btn-gallery')) {
                const installBtn = this.createInstallButtonForGallery();
                controlsOverlay.appendChild(installBtn);
            }
        };

        // Tentar adicionar imediatamente ou quando DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addInstallButtonToPage);
        } else {
            addInstallButtonToPage();
        }
    }

    createInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.innerHTML = '📱 Instalar App';
        installBtn.style.cssText = `
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            display: none;
        `;

        installBtn.addEventListener('click', () => this.promptInstall());
        installBtn.addEventListener('mouseover', () => {
            installBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        installBtn.addEventListener('mouseout', () => {
            installBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        return installBtn;
    }

    createInstallButtonForGallery() {
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn-gallery';
        installBtn.innerHTML = '📱';
        installBtn.title = 'Instalar como App';
        installBtn.style.cssText = `
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(0, 150, 0, 0.7);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            color: white;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            z-index: 3100;
            display: none;
        `;

        installBtn.addEventListener('click', () => this.promptInstall());
        installBtn.addEventListener('mouseover', () => {
            installBtn.style.background = 'rgba(0, 150, 0, 0.9)';
            installBtn.style.transform = 'scale(1.1)';
        });
        installBtn.addEventListener('mouseout', () => {
            installBtn.style.background = 'rgba(0, 150, 0, 0.7)';
            installBtn.style.transform = 'scale(1)';
        });

        return installBtn;
    }

    showInstallButton() {
        const loginBtn = document.getElementById('pwa-install-btn');
        const galleryBtn = document.getElementById('pwa-install-btn-gallery');
        
        if (loginBtn && !this.isInstalled) {
            loginBtn.style.display = 'block';
        }
        
        if (galleryBtn && !this.isInstalled) {
            galleryBtn.style.display = 'block';
        }
    }

    hideInstallButton() {
        const loginBtn = document.getElementById('pwa-install-btn');
        const galleryBtn = document.getElementById('pwa-install-btn-gallery');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (galleryBtn) galleryBtn.style.display = 'none';
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            this.showInstallInstructions();
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ Usuário aceitou instalar o PWA');
        } else {
            console.log('❌ Usuário recusou instalar o PWA');
        }

        this.deferredPrompt = null;
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                Para instalar no iOS Safari:
                1. Toque no ícone de compartilhar (⬆️)
                2. Role para baixo e toque em "Adicionar à Tela Inicial"
                3. Toque em "Adicionar"
            `;
        } else if (isAndroid) {
            instructions = `
                Para instalar no Android Chrome:
                1. Toque no menu (⋮)
                2. Toque em "Adicionar à tela inicial"
                3. Toque em "Adicionar"
            `;
        } else {
            instructions = `
                Para instalar no desktop:
                1. Clique no ícone de instalação na barra de endereços
                2. Ou acesse Menu → Instalar aplicativo
            `;
        }

        alert(instructions);
    }

    showConnectivityStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${type === 'success' ? 'rgba(0, 150, 0, 0.9)' : 'rgba(255, 140, 0, 0.9)'};
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 3000);
    }

    handleUpdate(registration) {
        const waiting = registration.waiting;
        if (waiting) {
            waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

// Inicializar PWA Manager
const pwaManager = new PWAManager();

// Expor para uso global
window.pwaManager = pwaManager;

console.log('📱 PWA Manager carregado');
