// PWA Manager com Botão de Instalação Personalizado
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installButton = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando PWA Manager...');
        
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.detectInstallation();
        this.setupConnectivityEvents();
        this.createCustomInstallButton();
        
        console.log('✅ PWA Manager inicializado');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);
                
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Nova versão disponível');
                    this.handleUpdate(registration);
                });
                
                return registration;
            } catch (error) {
                console.error('❌ Erro ao registrar Service Worker:', error);
            }
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('📱 Prompt de instalação capturado');
            event.preventDefault();
            this.deferredPrompt = event;
            this.updateInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalado com sucesso');
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.updateInstallButton();
        });
    }

    detectInstallation() {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('📱 Rodando como PWA instalado');
        }
        
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('📱 Rodando como PWA no iOS');
        }
    }

    setupConnectivityEvents() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada');
            this.showNotification('Conectado', '#4CAF50');
        });

        window.addEventListener('offline', () => {
            console.log('📡 Modo offline ativo');
            this.showNotification('Modo Offline', '#FF9800');
        });
    }

    // NOVA FUNÇÃO: Criar botão personalizado sempre visível
    createCustomInstallButton() {
        const createButton = () => {
            // Verificar em qual página estamos
            const isLoginPage = document.querySelector('.login-box') !== null;
            const isGalleryPage = document.getElementById('controls-overlay') !== null;
            
            if (isLoginPage) {
                this.createLoginInstallButton();
            } else if (isGalleryPage) {
                this.createGalleryInstallButton();
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createButton);
        } else {
            createButton();
        }
    }

    createLoginInstallButton() {
    const loginBox = document.querySelector('.login-box');
    if (!loginBox || document.getElementById('custom-install-btn')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'custom-install-btn';
    installBtn.innerHTML = `
        <span class="install-icon">📱</span>
        <span class="install-text">Instalar App</span>
    `;
    
    installBtn.style.cssText = `
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        padding: 12px 20px;
        color: white;
        font-size: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    `;
        
    installBtn.addEventListener('click', () => this.handleInstallClick());
    installBtn.addEventListener('mouseover', () => {
        installBtn.style.transform = 'translateY(-2px)';
        installBtn.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
        installBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });
    installBtn.addEventListener('mouseout', () => {
        installBtn.style.transform = 'translateY(0)';
        installBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        installBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    });

    loginBox.appendChild(installBtn);
    this.installButton = installBtn;
    this.updateInstallButton();
}

    

    createGalleryInstallButton() {
    const controlsOverlay = document.getElementById('controls-overlay');
    if (!controlsOverlay || document.getElementById('custom-install-btn-gallery')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'custom-install-btn-gallery';
    installBtn.innerHTML = '📱';
    installBtn.title = 'Instalar como App';
    
    installBtn.style.cssText = `
        position: absolute;
        top: 15px;
        left: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        z-index: 3100;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;

    installBtn.addEventListener('click', () => this.handleInstallClick());
    installBtn.addEventListener('mouseover', () => {
        installBtn.style.transform = 'scale(1.1)';
        installBtn.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
        installBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });
    installBtn.addEventListener('mouseout', () => {
        installBtn.style.transform = 'scale(1)';
        installBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        installBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    controlsOverlay.appendChild(installBtn);
    this.installButton = installBtn;
    this.updateInstallButton();
}


    updateInstallButton() {
        const loginBtn = document.getElementById('custom-install-btn');
        const galleryBtn = document.getElementById('custom-install-btn-gallery');
        
        if (this.isInstalled) {
            // Esconder botões se já instalado
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
            if (galleryBtn) {
                galleryBtn.style.display = 'none';
            }
        } else {
            // Mostrar botões se não instalado
            if (loginBtn) {
                loginBtn.style.display = 'flex';
                // Atualizar texto baseado na disponibilidade do prompt
                const textSpan = loginBtn.querySelector('.install-text');
                if (textSpan) {
                    textSpan.textContent = this.deferredPrompt ? 'Instalar App' : 'Adicionar à Tela';
                }
            }
            if (galleryBtn) {
                galleryBtn.style.display = 'block';
                galleryBtn.title = this.deferredPrompt ? 'Instalar como App' : 'Adicionar à Tela';
            }
        }
    }

    async handleInstallClick() {
        console.log('🎯 Botão de instalação clicado');
        
        if (this.deferredPrompt) {
            // Usar prompt nativo se disponível
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('✅ Usuário aceitou instalar via prompt');
                    this.showNotification('App instalado com sucesso!', '#4CAF50');
                } else {
                    console.log('❌ Usuário recusou instalar via prompt');
                }
                
                this.deferredPrompt = null;
                this.updateInstallButton();
            } catch (error) {
                console.error('Erro no prompt de instalação:', error);
                this.showManualInstructions();
            }
        } else {
            // Mostrar instruções manuais
            this.showManualInstructions();
        }
    }

    showManualInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        let title = 'Como Instalar o App';
        let instructions = '';
        
        if (isIOS || isSafari) {
            instructions = `
🍎 SAFARI (iPhone/iPad):
1. Toque no botão Compartilhar (⬆️)
2. Role para baixo e toque "Adicionar à Tela Inicial"
3. Toque "Adicionar"

O app aparecerá na sua tela inicial!`;
        } else if (isAndroid) {
            instructions = `
🤖 CHROME (Android):
1. Toque no menu (⋮) no canto superior
2. Toque em "Adicionar à tela inicial"
3. Toque "Adicionar"

Ou procure por "Instalar app" no menu!`;
        } else {
            instructions = `
💻 DESKTOP:
Chrome/Edge:
1. Clique no ícone de instalação (⊕) na barra de endereços
2. Ou Menu (⋮) → "Instalar Galeria de Fotos"
3. Clique "Instalar"

Firefox:
1. Menu (☰) → "Instalar este site como app"
2. Clique "Instalar"`;
        }

        this.showInstallModal(title, instructions);
    }

    showInstallModal(title, instructions) {
        // Criar modal de instruções
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            color: white;
            text-align: left;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;

        modalContent.innerHTML = `
            <h2 style="margin-bottom: 20px; text-align: center; font-size: 1.5rem;">
                📱 ${title}
            </h2>
            <pre style="
                white-space: pre-wrap;
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 25px;
                opacity: 0.95;
            ">${instructions}</pre>
            <button id="close-modal" style="
                width: 100%;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                padding: 12px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                Entendi ✓
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Fechar modal
        const closeBtn = document.getElementById('close-modal');
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Hover effect no botão
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
    }

    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 9999;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
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
window.pwaManager = pwaManager;

console.log('📱 PWA Manager com botão personalizado carregado');
