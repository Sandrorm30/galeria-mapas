// VERIFICAÇÃO DE AUTENTICAÇÃO - SEM CONTROLE DE TEMPO
(function() {
    function checkAuthentication() {
        const session = localStorage.getItem('gallery_auth_session');
        
        if (!session) {
            redirectToLogin();
            return false;
        }
        
        try {
            const sessionData = JSON.parse(session);
            console.log(`✅ Usuário autenticado: ${sessionData.username}`);
            return true;
        } catch (error) {
            localStorage.removeItem('gallery_auth_session');
            redirectToLogin();
            return false;
        }
    }
    
    function redirectToLogin() {
        console.log('🔐 Redirecionando para login...');
        window.location.href = 'login.html';
    }
    
    if (!checkAuthentication()) {
        return;
    }
    
    // Adicionar botão de logout na galeria
    function addLogoutButton() {
        const controlsOverlay = document.getElementById('controls-overlay');
        if (controlsOverlay) {
            const logoutBtn = document.createElement('button');
            logoutBtn.innerHTML = '🚪';
            logoutBtn.title = 'Sair';
            logoutBtn.style.cssText = `
                position: absolute;
                top: 15px;
                right: 10px;
                background: rgba(217, 215, 226, 0.7);
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                color: white;
                cursor: pointer;
                font-size: 20px;
                transition: all 0.3s ease;
                z-index: 3100;
            `;
            
            logoutBtn.addEventListener('click', () => {
                if (confirm('Deseja realmente sair da galeria?')) {
                    localStorage.removeItem('gallery_auth_session');
                    window.location.href = 'login.html';
                }
            });
            
            logoutBtn.addEventListener('mouseover', () => {
                logoutBtn.style.background = 'rgba(255, 0, 0, 0.9)';
                logoutBtn.style.transform = 'scale(1.1)';
            });
            
            logoutBtn.addEventListener('mouseout', () => {
                logoutBtn.style.background = 'rgba(217, 215, 226, 0.7)';
                logoutBtn.style.transform = 'scale(1)';
            });
            
            controlsOverlay.appendChild(logoutBtn);
        }
    }
    
    window.addEventListener('load', () => {
        setTimeout(addLogoutButton, 1000);
    });
    
})();

// CONFIGURAÇÃO
const SPREADSHEET_ID = '1OS6Wz9wtEAn39N7Zx9EizHaVm60CnHStUKjsWxelVUI';
const RANGE = 'A:B';

let photos = [];
let isDropdownOpen = false;
let isMobile = window.innerWidth <= 768;
let hideControlsTimeout;

// CONTROLE DE VISIBILIDADE DOS CONTROLES (APENAS DESKTOP)
function showControls() {
    if (isMobile) return;
    
    const controlsOverlay = document.getElementById('controls-overlay');
    const body = document.body;
    
    if (controlsOverlay) {
        controlsOverlay.classList.add('show');
        body.classList.add('show-cursor');
    }
    
    clearTimeout(hideControlsTimeout);
    
    hideControlsTimeout = setTimeout(() => {
        hideControls();
    }, 3000);
}

function hideControls() {
    if (isMobile) return;
    
    const controlsOverlay = document.getElementById('controls-overlay');
    const body = document.body;
    
    if (isDropdownOpen) {
        return;
    }
    
    if (controlsOverlay) {
        controlsOverlay.classList.remove('show');
        body.classList.remove('show-cursor');
    }
}

function forceHideControls() {
    if (isMobile) return;
    
    clearTimeout(hideControlsTimeout);
    const controlsOverlay = document.getElementById('controls-overlay');
    const body = document.body;
    
    if (controlsOverlay) {
        controlsOverlay.classList.remove('show');
        body.classList.remove('show-cursor');
    }
}

// DETECTAR SE É MOBILE
function checkMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== isMobile) {
        populateDropdown();
        
        if (isMobile) {
            const controlsOverlay = document.getElementById('controls-overlay');
            const body = document.body;
            if (controlsOverlay) {
                controlsOverlay.classList.add('show');
                body.classList.add('show-cursor');
            }
        }
    }
    
    if (isMobile) {
        document.body.className = 'portrait show-cursor';
        updateOrientationButtons('portrait');
    }
}

// CARREGAR DADOS DO GOOGLE SHEETS
async function loadPhotosFromSheets() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&range=${RANGE}`;
    
    try {
        showLoading('Carregando dados dos mapas...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n');
        photos = [];
        
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i] || rows[i].trim() === '') continue;
            
            const row = parseCSVRow(rows[i]);
            
            if (row.length >= 2 && row[0] && row[1]) {
                const name = row[0].trim();
                const url = row[1].trim();
                
                if (name && url && isValidURL(url)) {
                    photos.push({ name, url });
                }
            }
        }

        hideLoading();
        
        if (photos.length === 0) {
            showError('Nenhum mapa encontrado.');
            if (!isMobile) showControls();
            return;
        }

        populateDropdown();
        console.log(`✅ ${photos.length} mapas carregados com sucesso`);
        
    } catch (error) {
        hideLoading();
        console.error('Erro ao carregar mapas:', error);
        
        if (error.message.includes('404')) {
            showError('Arquivo não encontrado. Verifique o ID do arquivo.');
        } else if (error.message.includes('403')) {
            showError('Acesso negado. Certifique-se de que o arquivo está público.');
        } else {
            showError('Erro ao conectar com o arquivo. Verifique sua conexão.');
        }
        
        if (!isMobile) showControls();
    }
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function showLoading(message = 'Carregando...') {
    const loading = document.getElementById('loading');
    const textElement = loading.querySelector('div:last-child');
    if (textElement) {
        textElement.textContent = message;
    }
    loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 10000);
    }
}

function populateDropdown() {
    const desktopMenu = document.getElementById('dropdown-menu');
    const mobileMenu = document.getElementById('dropdown-menu-mobile');
    
    if (desktopMenu) desktopMenu.innerHTML = '';
    if (mobileMenu) mobileMenu.innerHTML = '';

    photos.forEach((photo, index) => {
        if (desktopMenu) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = photo.name;
            item.onclick = () => selectPhoto(index);
            desktopMenu.appendChild(item);
        }
        
        if (mobileMenu) {
            const itemMobile = document.createElement('div');
            itemMobile.className = 'dropdown-item';
            itemMobile.textContent = photo.name;
            itemMobile.onclick = () => selectPhoto(index);
            mobileMenu.appendChild(itemMobile);
        }
    });

    if (photos.length > 0) {
        selectPhoto(0);
    }
}

function toggleDropdown() {
    const desktopMenu = document.getElementById('dropdown-menu');
    const mobileMenu = document.getElementById('dropdown-menu-mobile');
    const arrows = document.querySelectorAll('.arrow');
    
    isDropdownOpen = !isDropdownOpen;
    
    arrows.forEach(arrow => {
        if (isDropdownOpen) {
            arrow.classList.add('rotated');
        } else {
            arrow.classList.remove('rotated');
        }
    });
    
    if (isMobile) {
        if (mobileMenu) {
            if (isDropdownOpen) {
                mobileMenu.classList.add('show');
            } else {
                mobileMenu.classList.remove('show');
            }
        }
    } else {
        if (desktopMenu) {
            if (isDropdownOpen) {
                desktopMenu.classList.add('show');
                showControls();
            } else {
                desktopMenu.classList.remove('show');
            }
        }
    }
}

function closeDropdown() {
    const desktopMenu = document.getElementById('dropdown-menu');
    const mobileMenu = document.getElementById('dropdown-menu-mobile');
    const arrows = document.querySelectorAll('.arrow');
    
    arrows.forEach(arrow => arrow.classList.remove('rotated'));
    
    if (desktopMenu) desktopMenu.classList.remove('show');
    if (mobileMenu) mobileMenu.classList.remove('show');
    
    isDropdownOpen = false;
}

function selectPhoto(index) {
    if (index < 0 || index >= photos.length) return;

    const photo = photos[index];
    const desktopText = document.getElementById('selected-text');
    const mobileText = document.getElementById('selected-text-mobile');
    const mainImage = document.getElementById('main-image');
    
    if (desktopText) desktopText.textContent = photo.name;
    if (mobileText) mobileText.textContent = photo.name;
    
    closeDropdown();
    
    if (!isMobile) {
        forceHideControls();
    }

    showLoading('Carregando imagem...');
    mainImage.style.display = 'none';
    mainImage.classList.remove('loaded');

    const newImage = new Image();
    const timeout = setTimeout(() => {
        hideLoading();
        showImagePlaceholder(photo.name, 'Timeout ao carregar');
    }, 15000);

    newImage.onload = () => {
        clearTimeout(timeout);
        mainImage.src = photo.url;
        mainImage.alt = photo.name;
        mainImage.style.display = 'block';
        hideLoading();
        
        setTimeout(() => {
            mainImage.classList.add('loaded');
        }, 100);
        
        console.log(`✅ Imagem carregada: ${photo.name}`);
    };

    newImage.onerror = () => {
        clearTimeout(timeout);
        hideLoading();
        console.error(`❌ Erro ao carregar: ${photo.name}`);
        showImagePlaceholder(photo.name, 'Erro ao carregar');
    };

    newImage.src = photo.url;
}

function showImagePlaceholder(photoName, errorMessage) {
    const mainImage = document.getElementById('main-image');
    
    const placeholderSVG = `data:image/svg+xml;base64,${btoa(`
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <circle cx="400" cy="250" r="50" fill="#6c757d"/>
            <rect x="350" y="320" width="100" height="60" rx="8" fill="#6c757d"/>
            <text x="400" y="420" font-family="Arial" font-size="24" fill="#6c757d" text-anchor="middle">${errorMessage}</text>
            <text x="400" y="450" font-family="Arial" font-size="18" fill="#adb5bd" text-anchor="middle">${photoName}</text>
        </svg>
    `)}`;
    
    mainImage.src = placeholderSVG;
    mainImage.alt = `${errorMessage}: ${photoName}`;
    mainImage.style.display = 'block';
    
    setTimeout(() => {
        mainImage.classList.add('loaded');
    }, 100);
}

function changeOrientation(orientation) {
    if (isMobile) {
        console.log('Orientação bloqueada no mobile');
        return;
    }
    
    console.log(`Mudando para orientação: ${orientation}`);
    
    document.body.className = '';
    document.body.offsetHeight;
    document.body.classList.add(orientation);
    
    updateOrientationButtons(orientation);
    localStorage.setItem('gallery-orientation', orientation);
    
    setTimeout(() => {
        const mainImage = document.getElementById('main-image');
        if (mainImage && mainImage.style.display !== 'none') {
            mainImage.style.display = 'none';
            setTimeout(() => {
                mainImage.style.display = 'block';
                console.log(`✅ Re-renderizado em ${orientation}`);
            }, 50);
        }
    }, 100);
}

function updateOrientationButtons(orientation) {
    const buttons = document.querySelectorAll('.orientation-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.getElementById(`btn-${orientation}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function loadSavedOrientation() {
    if (isMobile) {
        document.body.classList.add('portrait');
        return;
    }
    
    const savedOrientation = localStorage.getItem('gallery-orientation') || 'portrait';
    changeOrientation(savedOrientation);
}

function handleKeyboard(event) {
    if (!photos.length) return;
    
    if (!isMobile) {
        showControls();
    }
    
    const selectedTextElement = document.getElementById('selected-text') || document.getElementById('selected-text-mobile');
    const currentText = selectedTextElement ? selectedTextElement.textContent : '';
    const currentIndex = photos.findIndex(photo => photo.name === currentText);
    
    switch(event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % photos.length;
            selectPhoto(nextIndex);
            break;
            
        case 'ArrowUp':
        case 'ArrowLeft':
            event.preventDefault();
            const prevIndex = currentIndex <= 0 ? photos.length - 1 : currentIndex - 1;
            selectPhoto(prevIndex);
            break;
            
        case 'Escape':
            closeDropdown();
            if (!isMobile) {
                forceHideControls();
            }
            break;
            
        case 'p':
        case 'P':
            if (!isMobile) changeOrientation('portrait');
            break;
            
        case 'l':
        case 'L':
            if (!isMobile) changeOrientation('landscape');
            break;
            
        case ' ':
            if (!isMobile) {
                event.preventDefault();
                const controlsOverlay = document.getElementById('controls-overlay');
                if (controlsOverlay.classList.contains('show')) {
                    forceHideControls();
                } else {
                    showControls();
                }
            }
            break;
    }
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown-wrapper')) {
        closeDropdown();
    }
});

document.addEventListener('keydown', handleKeyboard);

document.addEventListener('mousemove', () => {
    if (!isMobile) showControls();
});

document.addEventListener('touchstart', () => {
    if (!isMobile) showControls();
});

document.addEventListener('touchmove', () => {
    if (!isMobile) showControls();
});

document.getElementById('image-area').addEventListener('click', (event) => {
    if (!isMobile && (event.target.id === 'main-image' || event.target.id === 'image-area')) {
        forceHideControls();
    }
});

window.addEventListener('resize', () => {
    checkMobile();
});

window.addEventListener('load', () => {
    console.log('🚀 Iniciando galeria de fotos...');
    checkMobile();
    loadPhotosFromSheets();
    loadSavedOrientation();
    
    if (!isMobile) {
        showControls();
    }
});

window.addEventListener('online', () => {
    console.log('🌐 Conexão restaurada');
    if (photos.length === 0) {
        loadPhotosFromSheets();
    }
});

window.addEventListener('offline', () => {
    console.log('⚠️ Conexão perdida');
    showError('Conexão com a internet perdida.');
});

function reloadData() {
    photos = [];
    const elements = [
        'dropdown-menu', 'dropdown-menu-mobile',
        'selected-text', 'selected-text-mobile', 'main-image'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('dropdown-menu')) {
                element.innerHTML = '';
            } else if (id.includes('selected-text')) {
                element.textContent = 'Selecione uma foto';
            } else if (id === 'main-image') {
                element.style.display = 'none';
            }
        }
    });
    
    loadPhotosFromSheets();
}

window.reloadGallery = reloadData;

console.log('📸 Galeria de Fotos - Script carregado');

