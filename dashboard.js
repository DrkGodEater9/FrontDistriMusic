// DistriMusic - Dashboard JavaScript FUNCIONAL CORREGIDO

// URL base de la API
const API_BASE_URL = 'http://localhost:8090/api';

// Variable global para el usuario actual
let currentUser = null;

// ✅ FUNCIÓN PARA VERIFICAR AUTENTICACIÓN
function checkAuthentication() {
    console.log('🔍 Verificando autenticación...');
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('currentUser');
    
    console.log('isLoggedIn:', isLoggedIn);
    console.log('userData existe:', !!userData);
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
        console.log('❌ No hay sesión activa, redirigiendo al login');
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        currentUser = JSON.parse(userData);
        console.log('✅ Usuario cargado exitosamente:', currentUser.nombre);
        console.log('👤 Usuario completo:', currentUser);
        return true;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        logout();
        return false;
    }
}

// ✅ FUNCIÓN PARA CARGAR INFO DEL USUARIO
function loadUserInfo() {
    if (!currentUser) {
        console.log('❌ No hay currentUser disponible');
        return;
    }
    
    console.log('✅ Cargando info del usuario:', currentUser.nombre);
    
    const userName = document.getElementById('userName');
    const userCareer = document.getElementById('userCareer');
    
    if (userName) {
        userName.textContent = currentUser.nombre;
        console.log('✅ Nombre cargado:', currentUser.nombre);
    } else {
        console.log('❌ Elemento userName no encontrado');
    }
    
    if (userCareer) {
        userCareer.textContent = currentUser.carrera;
        console.log('✅ Carrera cargada:', currentUser.carrera);
    } else {
        console.log('❌ Elemento userCareer no encontrado');
    }
}

// ✅ FUNCIÓN PARA CERRAR SESIÓN
function logout() {
    console.log('🔄 Ejecutando logout...');
    
    // Limpiar localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    
    console.log('✅ localStorage limpiado');
    
    // Mostrar mensaje
    showMessage('Sesión cerrada exitosamente', 'success');
    
    // Redirigir después de un momento
    setTimeout(() => {
        console.log('🔄 Redirigiendo a auth.html...');
        window.location.href = 'auth.html';
    }, 1000);
}

// ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS
async function loadUserStats() {
    if (!currentUser) return;
    
    console.log('📊 Cargando estadísticas del usuario...');
    
    try {
        // Cargar seguidores
        const seguidoresResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/followers`);
        if (seguidoresResponse.ok) {
            const seguidores = await seguidoresResponse.json();
            document.getElementById('statSeguidores').textContent = seguidores.length;
            console.log('✅ Seguidores cargados:', seguidores.length);
        }
        
        // Cargar siguiendo
        const siguiendoResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/following`);
        if (siguiendoResponse.ok) {
            const siguiendo = await siguiendoResponse.json();
            document.getElementById('statSiguiendo').textContent = siguiendo.length;
            console.log('✅ Siguiendo cargados:', siguiendo.length);
        }
        
    } catch (error) {
        console.error('❌ Error loading user stats:', error);
    }
}

// ✅ FUNCIÓN PARA CARGAR MIS PLAYLISTS
async function loadMyPlaylists() {
    if (!currentUser) return;
    
    const container = document.getElementById('misPlaylists');
    if (!container) return;
    
    console.log('🎵 Cargando mis playlists...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/user/${currentUser.usuario}`);
        
        if (response.ok) {
            const playlists = await response.json();
            console.log('✅ Playlists cargadas:', playlists.length);
            renderPlaylists(playlists, container, true);
        } else {
            console.log('❌ Error cargando playlists:', response.status);
            container.innerHTML = '<div class="empty-state"><h3>Error cargando playlists</h3></div>';
        }
    } catch (error) {
        console.error('❌ Error loading my playlists:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error de conexión</h3></div>';
    }
}

// ✅ FUNCIÓN PARA CARGAR PLAYLISTS PÚBLICAS
async function loadPublicPlaylists() {
    const container = document.getElementById('playlistsPublicas');
    if (!container) return;
    
    console.log('🌍 Cargando playlists públicas...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/public`);
        
        if (response.ok) {
            const playlists = await response.json();
            console.log('✅ Playlists públicas cargadas:', playlists.length);
            renderPlaylists(playlists, container, false);
        } else {
            console.log('❌ Error cargando playlists públicas:', response.status);
            container.innerHTML = '<div class="empty-state"><h3>Error cargando playlists públicas</h3></div>';
        }
    } catch (error) {
        console.error('❌ Error loading public playlists:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error de conexión</h3></div>';
    }
}

// ✅ FUNCIÓN PARA RENDERIZAR PLAYLISTS
function renderPlaylists(playlists, container, isOwner = false) {
    if (!playlists || playlists.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No hay playlists</h3>
                <p>${isOwner ? 'Crea tu primera playlist' : 'No hay playlists públicas disponibles'}</p>
            </div>
        `;
        return;
    }
    
    const playlistsHTML = playlists.map(playlist => {
        const ownerName = playlist.usuario ? playlist.usuario.nombre : 'Usuario desconocido';
        const createdDate = playlist.fechaCreacion ? 
            new Date(playlist.fechaCreacion).toLocaleDateString('es-ES') : 'Fecha desconocida';
        
        return `
            <div class="playlist-card" data-playlist-id="${playlist.id}" onclick="viewPlaylistDetails(${playlist.id})">
                <div class="playlist-cover">
                    🎵
                </div>
                <div class="playlist-info">
                    <h3>${playlist.nombre}</h3>
                    <p>Por: ${ownerName}</p>
                    <div class="playlist-meta">
                        <span class="playlist-type ${playlist.esPublica ? 'public' : 'private'}">
                            ${playlist.esPublica ? 'Pública' : 'Privada'}
                        </span>
                        <span>${createdDate}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = playlistsHTML;
}

// ✅ FUNCIÓN PARA VER DETALLES DE PLAYLIST
function viewPlaylistDetails(playlistId) {
    showMessage(`Ver detalles de playlist ${playlistId} (funcionalidad en desarrollo)`, 'info');
}

// ✅ FUNCIÓN PARA BUSCAR CANCIONES
async function searchSongs() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    console.log('🔍 Buscando canciones:', query);
    
    try {
        const response = await fetch(`${API_BASE_URL}/music/search?query=${encodeURIComponent(query)}`);
        
        if (response.ok) {
            const songs = await response.json();
            console.log('✅ Canciones encontradas:', songs.length);
            renderSearchResults(songs, resultsContainer);
        } else {
            console.log('❌ Error en búsqueda:', response.status);
            resultsContainer.innerHTML = '<div class="empty-state"><h3>Error en la búsqueda</h3></div>';
        }
    } catch (error) {
        console.error('❌ Error searching songs:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><h3>Error de conexión</h3></div>';
    }
}

// ✅ FUNCIÓN PARA RENDERIZAR RESULTADOS DE BÚSQUEDA
function renderSearchResults(songs, container) {
    container.style.display = 'block';
    
    if (!songs || songs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron canciones</h3>
                <p>Intenta con otra búsqueda</p>
            </div>
        `;
        return;
    }
    
    const songsHTML = songs.map(song => `
        <div class="result-item" onclick="selectSong(${song.id})">
            <div class="result-cover">🎵</div>
            <div class="result-info">
                <h4>${song.titulo}</h4>
                <p>${song.artista} - ${song.album}</p>
                <small>❤️ ${song.likes} likes</small>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h4>Resultados de búsqueda:</h4>
        ${songsHTML}
    `;
}

// ✅ FUNCIÓN PARA SELECCIONAR CANCIÓN
function selectSong(songId) {
    showMessage(`Canción ${songId} seleccionada (funcionalidad en desarrollo)`, 'info');
}

// ✅ FUNCIÓN PARA CREAR PLAYLIST
async function createPlaylist(playlistData) {
    try {
        const requestData = {
            ...playlistData,
            usuario: currentUser
        };
        
        console.log('📝 Creando playlist:', requestData);
        
        const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
            const newPlaylist = await response.json();
            console.log('✅ Playlist creada:', newPlaylist);
            showMessage('¡Playlist creada exitosamente!', 'success');
            loadMyPlaylists();
            return newPlaylist;
        } else {
            const errorData = await response.text();
            console.log('❌ Error creando playlist:', errorData);
            showMessage(`Error al crear playlist: ${errorData}`, 'error');
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating playlist:', error);
        showMessage('Error de conexión al crear playlist', 'error');
        return null;
    }
}

// ✅ FUNCIÓN PARA MANEJAR FORMULARIO DE PLAYLIST
function handleCreatePlaylist(event) {
    event.preventDefault();
    
    const playlistName = document.getElementById('playlistName').value.trim();
    const isPublic = document.getElementById('isPublic').checked;
    
    if (!playlistName) {
        showMessage('El nombre de la playlist es obligatorio', 'error');
        return;
    }
    
    const playlistData = {
        nombre: playlistName,
        esPublica: isPublic
    };
    
    createPlaylist(playlistData).then(result => {
        if (result) {
            document.getElementById('playlistModal').style.display = 'none';
            document.getElementById('playlistForm').reset();
        }
    });
}

// ✅ FUNCIÓN PARA NAVEGACIÓN
function showSection(sectionName) {
    console.log('📍 Navegando a sección:', sectionName);
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Cargar datos específicos
    switch (sectionName) {
        case 'inicio':
            loadMyPlaylists();
            break;
        case 'explorar':
            loadPublicPlaylists();
            break;
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES
function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.dashboard-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `dashboard-message ${type}`;
    messageDiv.textContent = message;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    switch (type) {
        case 'success':
            messageDiv.style.background = '#10b981';
            messageDiv.style.color = '#ffffff';
            break;
        case 'error':
            messageDiv.style.background = '#ef4444';
            messageDiv.style.color = '#ffffff';
            break;
        case 'info':
            messageDiv.style.background = '#8b5cf6';
            messageDiv.style.color = '#ffffff';
            break;
        default:
            messageDiv.style.background = '#535353';
            messageDiv.style.color = '#ffffff';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 4000);
}

// ✅ DEBOUNCE PARA BÚSQUEDA
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ✅ INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando DistriMusic Dashboard...');
    
    // Verificar autenticación
    if (!checkAuthentication()) {
        return;
    }
    
    // Cargar información del usuario
    loadUserInfo();
    loadUserStats();
    loadMyPlaylists();
    
    // ✅ EVENT LISTENERS
    
    // Navegación
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        console.log('✅ Botón logout encontrado');
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Logout clickeado');
            logout();
        });
    } else {
        console.log('❌ Botón logout NO encontrado');
    }
    
    // Crear playlist
    const btnCreatePlaylist = document.getElementById('btnCreatePlaylist');
    if (btnCreatePlaylist) {
        btnCreatePlaylist.addEventListener('click', () => {
            document.getElementById('playlistModal').style.display = 'block';
        });
    }
    
    // Modal
    const playlistModal = document.getElementById('playlistModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            playlistModal.style.display = 'none';
        });
    }
    
    if (cancelModal) {
        cancelModal.addEventListener('click', () => {
            playlistModal.style.display = 'none';
        });
    }
    
    // Cerrar modal al hacer click fuera
    if (playlistModal) {
        playlistModal.addEventListener('click', (e) => {
            if (e.target === playlistModal) {
                playlistModal.style.display = 'none';
            }
        });
    }
    
    // Formulario de playlist
    const playlistForm = document.getElementById('playlistForm');
    if (playlistForm) {
        playlistForm.addEventListener('submit', handleCreatePlaylist);
    }
    
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    
    if (searchInput) {
        const debouncedSearch = debounce(searchSongs, 300);
        searchInput.addEventListener('input', debouncedSearch);
        
        searchInput.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                const resultsContainer = document.getElementById('searchResults');
                if (resultsContainer) {
                    resultsContainer.style.display = 'none';
                }
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchSongs();
            }
        });
    }
    
    if (btnSearch) {
        btnSearch.addEventListener('click', searchSongs);
    }
    
    // Refrescar explorar
    const btnRefreshExplorar = document.getElementById('btnRefreshExplorar');
    if (btnRefreshExplorar) {
        btnRefreshExplorar.addEventListener('click', loadPublicPlaylists);
    }
    
    // Filtro de carrera
    const filterCarrera = document.getElementById('filterCarrera');
    if (filterCarrera) {
        filterCarrera.addEventListener('change', () => {
            loadPublicPlaylists();
        });
    }
    
    // ✅ AGREGAR ESTILOS CSS PARA ANIMACIONES
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--spotify-light-gray);
            grid-column: 1 / -1;
        }
        
        .empty-state h3 {
            margin-bottom: 8px;
            color: var(--spotify-white);
            font-size: 18px;
        }
        
        .empty-state p {
            font-size: 14px;
        }
        
        .playlist-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .playlist-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
        }
        
        .result-item {
            transition: background-color 0.2s ease;
        }
        
        .result-item:hover {
            background: rgba(139, 92, 246, 0.1);
        }
        
        .search-results {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
        }
        
        .search-results h4 {
            margin-bottom: 16px;
            color: var(--spotify-white);
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Dashboard inicializado correctamente');
    console.log('👤 Usuario actual:', currentUser?.nombre);
});

// ✅ FUNCIONES GLOBALES PARA USO EN HTML
window.viewPlaylistDetails = viewPlaylistDetails;
window.selectSong = selectSong;
window.showSection = showSection;

// ✅ TEST DE CONEXIÓN
console.log('🌐 Probando conexión con backend...');
fetch(`${API_BASE_URL}/users`)
    .then(response => {
        if (response.ok) {
            console.log('✅ Backend conectado correctamente');
        } else {
            console.log('⚠️ Backend responde pero con error:', response.status);
        }
    })
    .catch(error => {
        console.log('❌ Backend NO conectado:', error.message);
        console.log('🔧 Verifica que Spring Boot esté corriendo en puerto 8090');
    });