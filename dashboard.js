// DistriMusic - Dashboard JavaScript CORREGIDO

// URL base de la API
const API_BASE_URL = 'http://localhost:8090/api';

// Variable global para el usuario actual
let currentUser = null;
let selectedPlaylistForSongs = null;
let currentPlaylistSongs = []; // Array para mantener las canciones actuales de la playlist

// ✅ FUNCIÓN PARA VERIFICAR AUTENTICACIÓN
function checkAuthentication() {
    console.log('🔍 Verificando autenticación...');

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('currentUser');

    if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
        console.log('❌ No hay sesión activa, redirigiendo al login');
        window.location.href = 'auth.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        console.log('✅ Usuario cargado:', currentUser.nombre);
        return true;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        logout();
        return false;
    }
}

// ✅ FUNCIÓN PARA CARGAR INFO DEL USUARIO
function loadUserInfo() {
    if (!currentUser) return;

    const userName = document.getElementById('userName');
    const userCareer = document.getElementById('userCareer');

    if (userName) {
        userName.textContent = currentUser.nombre;
    }

    if (userCareer) {
        userCareer.textContent = currentUser.carrera;
    }
}

// ✅ FUNCIÓN PARA CERRAR SESIÓN
function logout() {
    console.log('🔄 Ejecutando logout...');

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');

    showMessage('Sesión cerrada exitosamente', 'success');

    setTimeout(() => {
        window.location.href = 'auth.html';
    }, 1000);
}

// ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS
async function loadUserStats() {
    if (!currentUser) return;

    try {
        // Cargar seguidores
        const seguidoresResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/followers`);
        if (seguidoresResponse.ok) {
            const seguidores = await seguidoresResponse.json();
            document.getElementById('statSeguidores').textContent = seguidores.length;
            // Guardar lista para mostrar en modal
            window._userFollowersList = seguidores;
        }

        // Cargar siguiendo
        const siguiendoResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/following`);
        if (siguiendoResponse.ok) {
            const siguiendo = await siguiendoResponse.json();
            document.getElementById('statSiguiendo').textContent = siguiendo.length;
            // Guardar lista para mostrar en modal
            window._userFollowingList = siguiendo;
        }

    } catch (error) {
        console.error('❌ Error loading user stats:', error);
    }
}
// ✅ MODAL PARA VER SEGUIDORES Y SIGUIENDO
function showUserListModal(type) {
    let users = [];
    let title = '';
    if (type === 'followers') {
        users = window._userFollowersList || [];
        title = 'Tus seguidores';
    } else {
        users = window._userFollowingList || [];
        title = 'A quién sigues';
    }
    let html = `<div class="user-list-modal-content">
        <h3>${title}</h3>
        <ul class="user-list-modal-ul">
            ${users.length === 0 ? '<li>No hay usuarios para mostrar</li>' : users.map(u => `
                <li>
                    <span class="user-list-avatar">${u.profileImageUrl && isValidUrl(u.profileImageUrl) ? `<img src='${u.profileImageUrl}' alt='avatar' class='user-list-img'>` : (u.nombre ? u.nombre.charAt(0).toUpperCase() : '👤')}</span>
                    <span class="user-list-name">${u.nombre || u.usuario}</span>
                    <span class="user-list-username">@${u.usuario}</span>
                </li>
            `).join('')}
        </ul>
        <button class="btn-secondary" id="btnCloseUserListModal">Cerrar</button>
    </div>`;
    let modal = document.getElementById('userListModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'userListModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
        document.body.appendChild(modal);
    } else {
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
    }
    modal.style.display = 'block';
    setTimeout(() => {
        const btnClose = document.getElementById('btnCloseUserListModal');
        if (btnClose) btnClose.onclick = closeUserListModal;
    }, 0);
}

function closeUserListModal() {
    const modal = document.getElementById('userListModal');
    if (modal) modal.style.display = 'none';
}

// Agregar estilos para el modal de lista de usuarios
const userListModalStyle = document.createElement('style');
userListModalStyle.textContent = `
    .user-list-modal-content { padding: 24px 16px 16px 16px; min-width: 280px; }
    .user-list-modal-ul { list-style: none; padding: 0; margin: 16px 0 0 0; max-height: 320px; overflow-y: auto; }
    .user-list-modal-ul li { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; }
    .user-list-avatar { width: 36px; height: 36px; border-radius: 50%; background: #f3f3f3; display: flex; align-items: center; justify-content: center; font-size: 18px; overflow: hidden; }
    .user-list-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    .user-list-name { font-weight: 500; margin-right: 6px; }
    .user-list-username { color: #888; font-size: 13px; }
`;
document.head.appendChild(userListModalStyle);

// ✅ FUNCIÓN PARA CARGAR MIS PLAYLISTS
async function loadMyPlaylists() {
    if (!currentUser) return;

    const container = document.getElementById('misPlaylists');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/playlists/user/${currentUser.usuario}`);

        if (response.ok) {
            const playlists = await response.json();
            renderPlaylists(playlists, container, true);
        } else {
            container.innerHTML = '<div class="empty-state"><h3>Error cargando playlists</h3></div>';
        }
    } catch (error) {
        console.error('❌ Error loading playlists:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error de conexión</h3></div>';
    }
}

// ✅ FUNCIÓN PARA CARGAR PLAYLISTS PÚBLICAS
async function loadPublicPlaylists() {
    const container = document.getElementById('playlistsPublicas');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/playlists/public`);

        if (response.ok) {
            const playlists = await response.json();
            renderPlaylists(playlists, container, false);
        } else {
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

        // Usar imagen personalizada si existe, sino usar emoji por defecto
        const imageContent = playlist.imageUrl ?
            `<img src="${playlist.imageUrl}" alt="${playlist.nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` :
            '🎵';

        return `
            <div class="playlist-card" data-playlist-id="${playlist.id}" onclick="viewPlaylistDetails(${playlist.id})">
                <div class="playlist-cover">
                    ${imageContent}
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

// ✅ FUNCIÓN PARA VER DETALLES DE PLAYLIST CON CANCIONES - CORREGIDA
async function viewPlaylistDetails(playlistId) {
    try {
        // Cargar datos de la playlist
        const playlistResponse = await fetch(`${API_BASE_URL}/playlists/${playlistId}`);
        if (!playlistResponse.ok) {
            showMessage('Error cargando la playlist', 'error');
            return;
        }

        const playlist = await playlistResponse.json();

        // Cargar canciones de la playlist
        const songsResponse = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`);
        let songs = [];
        if (songsResponse.ok) {
            songs = await songsResponse.json();
        }

        // Actualizar variable global
        currentPlaylistSongs = songs;

        // Mostrar modal con detalles
        showPlaylistDetailModal(playlist, songs);

    } catch (error) {
        console.error('❌ Error loading playlist details:', error);
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MODAL DE DETALLES DE PLAYLIST - CORREGIDA
function showPlaylistDetailModal(playlist, songs) {
    const modal = document.getElementById('playlistDetailModal');
    const titleElement = document.getElementById('detailPlaylistName');
    const ownerElement = document.getElementById('detailPlaylistOwner');
    const dateElement = document.getElementById('detailPlaylistDate');
    const typeElement = document.getElementById('detailPlaylistType');

    // Limpiar contenido dinámico anterior
    const contentArea = modal.querySelector('.playlist-detail-content');
    const existingSongs = contentArea.querySelectorAll('.playlist-songs, .playlist-actions, .empty-songs');
    existingSongs.forEach(el => el.remove());

    if (titleElement) titleElement.textContent = playlist.nombre;
    if (ownerElement) ownerElement.textContent = `Por: ${playlist.usuario?.nombre || 'Usuario desconocido'}`;
    if (dateElement) {
        const date = playlist.fechaCreacion ?
            new Date(playlist.fechaCreacion).toLocaleDateString('es-ES') : 'Fecha desconocida';
        dateElement.textContent = `Creada el: ${date}`;
    }
    if (typeElement) typeElement.textContent = `Tipo: ${playlist.esPublica ? 'Pública' : 'Privada'}`;


    // Agregar lista de canciones
    let songsHTML = songs.length > 0 ? `
        <div class="playlist-songs">
            <h4>Canciones (${songs.length})</h4>
            <div class="songs-list">
                ${songs.map(song => `
                    <div class="song-item" data-song-id="${song.id}">
                        <div class="song-cover">
                            ${song.imageUrl ?
                                `<img src="${song.imageUrl}" alt="${song.titulo}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;">` :
                                '<div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--spotify-purple), var(--distrital-gold)); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">🎵</div>'
                            }
                        </div>
                        <div class="song-info">
                            <h5>${song.titulo}</h5>
                            <p>${song.artista} - ${song.album}</p>
                        </div>
                        ${currentUser && playlist.usuario?.usuario === currentUser.usuario ?
                            `<button class="btn-remove-song" onclick="removeSongFromPlaylist(${playlist.id}, ${song.id})">
                                <span class="material-icons">remove</span>
                            </button>` : ''
                        }
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '<div class="empty-songs"><p>Esta playlist no tiene canciones aún</p></div>';

    // Botón para agregar canciones si es el propietario (fuera de la lista de canciones, SEPARADO)
    const addSongsButton = currentUser && playlist.usuario?.usuario === currentUser.usuario ? `
        <div class="playlist-section-divider"></div>
        <div class="playlist-actions playlist-add-songs-actions">
            <button class="btn-primary" onclick="showAddSongsModal(${playlist.id})">
                <span class="material-icons">add</span>
                Agregar Canciones
            </button>
        </div>
    ` : '';

    // Botón para ver perfil del creador (si no es el usuario actual)
    const viewProfileButtonHTML = (playlist.usuario && currentUser && playlist.usuario.usuario !== currentUser.usuario) ? `
        <div class="playlist-section-divider"></div>
        <div class="playlist-actions" style="margin: 10px 0 0 0; display: flex; justify-content: flex-end;">
            <button class="btn-primary" id="btnViewCreatorProfile">
                <span class="material-icons">account_circle</span>
                Ver perfil de ${playlist.usuario.nombre}
            </button>
        </div>
    ` : '';

    // Actualizar el contenido del modal
    const existingPlaylistInfo = contentArea.querySelector('.playlist-info');
    if (existingPlaylistInfo) {
        // Primero canciones, luego botón agregar canciones, luego perfil, luego comentarios
        existingPlaylistInfo.insertAdjacentHTML('afterend',
            songsHTML +
            addSongsButton +
            viewProfileButtonHTML +
            '<div class="playlist-section-divider"></div>' +
            // Mover la sección de comentarios aquí
            '<div id="commentsSection" style="display:none;">\
                <div class="comments-title">Comentarios</div>\
                <div id="commentsList"></div>\
                <form id="commentForm">\
                    <input type="text" id="commentInput" class="input" placeholder="Escribe un comentario..." maxlength="200">\
                    <button type="submit">Comentar</button>\
                </form>\
            </div>'
        );
    }
// Estilos para separar secciones en el modal de playlist
const playlistSectionDividerStyle = document.createElement('style');
playlistSectionDividerStyle.textContent = `
    .playlist-section-divider {
        width: 100%;
        height: 18px;
        border: none;
        margin: 18px 0 0 0;
        background: transparent;
        display: block;
    }
    .playlist-add-songs-actions {
        margin: 0 0 18px 0;
        display: flex;
        justify-content: flex-end;
        position: relative;
        z-index: 10;
    }
    .playlist-songs {
        position: relative;
        z-index: 5;
    }
    .playlist-actions button, .btn-primary, .btn-secondary, .btn-remove-song, .btn-add-song {
        z-index: 20;
        position: relative;
    }
    .playlist-actions button:active, .btn-primary:active, .btn-secondary:active, .btn-remove-song:active, .btn-add-song:active {
        filter: brightness(0.92);
        outline: none;
    }
    .playlist-actions button:focus, .btn-primary:focus, .btn-secondary:focus, .btn-remove-song:focus, .btn-add-song:focus {
        outline: 2px solid #8b5cf6;
        outline-offset: 2px;
    }
`;
document.head.appendChild(playlistSectionDividerStyle);

    // Mostrar sección de comentarios solo si la playlist es pública
    setTimeout(() => {
        const commentsSection = document.getElementById('commentsSection');
        if (playlist.esPublica && commentsSection) {
            commentsSection.style.display = 'block';
            loadCommentsForPlaylist(playlist.id);
            // Habilitar formulario
            const commentForm = document.getElementById('commentForm');
            if (commentForm) {
                commentForm.onsubmit = function(e) {
                    e.preventDefault();
                    submitComment(playlist.id);
                };
            }
        } else if (commentsSection) {
            commentsSection.style.display = 'none';
        }
    }, 0);
// Cargar comentarios de una playlist pública
async function loadCommentsForPlaylist(playlistId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.innerHTML = '<div class="loading">Cargando comentarios...</div>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/comments/playlist/${playlistId}`);
        const errorText = await res.text();
        
        try {
            // Intentar parsear como JSON primero
            const comments = JSON.parse(errorText);
            
            if (res.ok) {
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="empty-comments">Sé el primero en comentar esta playlist.</div>';
                } else {
                    commentsList.innerHTML = comments.map(c => {
                        const isOwner = currentUser && c.usuario && c.usuario.usuario === currentUser.usuario;
                        return `
                            <div class="comment-item" data-comment-id="${c.id}">
                                <div class="comment-header">
                                    <span class="comment-user">${c.usuario?.nombre || c.usuario?.usuario || 'Usuario'}</span>
                                    <span class="comment-date">${c.fechaComentario ? new Date(c.fechaComentario).toLocaleString('es-ES') : ''}</span>
                                    ${isOwner ? `
                                        <span class="comment-actions">
                                            <button class="btn-delete-comment" title="Eliminar" onclick="deleteComment(${c.id}, ${playlistId})">
                                                <span class="material-icons">delete</span>
                                            </button>
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="comment-content" id="commentContent${c.id}">${c.contenido}</div>
                            </div>
                        `;
                    }).join('');
                }
            } else {
                throw new Error('No es un JSON válido');
            }
        } catch (jsonError) {
            // Si no es JSON, manejar el texto del error
            console.error('Error del servidor:', errorText);
            
            if (res.status === 404) {
                commentsList.innerHTML = '<div class="empty-comments error">La playlist no existe o fue eliminada.</div>';
                showMessage('La playlist no existe o fue eliminada', 'error');
            } else if (res.status === 403) {
                commentsList.innerHTML = '<div class="empty-comments error">No tienes permiso para ver los comentarios de esta playlist.</div>';
                showMessage('No tienes permiso para ver los comentarios', 'error');
            } else {
                commentsList.innerHTML = '<div class="empty-comments error">No se pudieron cargar los comentarios.</div>';
                showMessage(errorText || 'Error al cargar comentarios', 'error');
            }
        }
    } catch (e) {
        console.error('Error de conexión:', e);
        commentsList.innerHTML = '<div class="empty-comments error">Error de conexión.</div>';
        showMessage('Error de conexión: ' + e.message, 'error');
    }
}

// Enviar nuevo comentario
async function submitComment(playlistId) {
    const input = document.getElementById('commentInput');
    const submitButton = document.querySelector('#commentForm button[type="submit"]');
    if (!input || !input.value.trim()) return;
    
    const contenido = input.value.trim();
    input.disabled = true;
    submitButton.disabled = true;
    
    try {
        const res = await fetch(`${API_BASE_URL}/comments/playlist/${playlistId}?usuario=${encodeURIComponent(currentUser.usuario)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido })
        });

        if (res.ok) {
            input.value = '';
            loadCommentsForPlaylist(playlistId);
            showMessage('Comentario agregado exitosamente', 'success');
        } else {
            const errorText = await res.text();
            console.error('Error del servidor:', errorText);
            
            if (res.status === 404) {
                showMessage('La playlist no existe o fue eliminada', 'error');
            } else if (res.status === 403) {
                showMessage('No tienes permiso para comentar en esta playlist', 'error');
            } else {
                showMessage(errorText || 'No se pudo enviar el comentario', 'error');
            }
        }
    } catch (e) {
        console.error('Error al enviar comentario:', e);
        showMessage('Error de conexión: ' + e.message, 'error');
    } finally {
        input.disabled = false;
        submitButton.disabled = false;
    }
}

// Eliminar comentario (solo el dueño)
window.deleteComment = async function(commentId, playlistId) {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/comments/${commentId}?usuario=${encodeURIComponent(currentUser.usuario)}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showMessage('Comentario eliminado', 'success');
            loadCommentsForPlaylist(playlistId);
        } else {
            showMessage('No se pudo eliminar el comentario', 'error');
        }
    } catch (e) {
        showMessage('Error de conexión', 'error');
    }
};

// Estilos para comentarios (mejorados para fondo oscuro y mejor visual)
const commentsStyle = document.createElement('style');
commentsStyle.textContent = `
    #commentsSection {
        border-top: 1px solid #8b5cf6;
        padding-top: 18px;
        margin-top: 18px;
        background: rgba(30, 20, 50, 0.7);
        border-radius: 0 0 16px 16px;
    }
    .comments-title {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
        letter-spacing: 0.5px;
    }
    .comment-item {
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid #3a2a5e;
        color: #fff;
        background: rgba(60, 40, 90, 0.25);
        border-radius: 8px;
        padding: 10px 12px 8px 12px;
    }
    .comment-header {
        font-size: 13px;
        color: #bfaaff;
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
        align-items: center;
    }
    .comment-user {
        font-weight: 600;
        color: #fff;
        margin-right: 8px;
    }
    .comment-date {
        font-style: italic;
        color: #bfaaff;
        margin-left: 8px;
    }
    .comment-content {
        font-size: 15px;
        color: #fff;
        margin-top: 2px;
        word-break: break-word;
    }
    .empty-comments {
        color: #bfaaff;
        font-size: 14px;
        margin: 12px 0;
        text-align: center;
    }
    .empty-comments.error {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
    #commentInput.input {
        border-radius: 6px;
        border: 1px solid #8b5cf6;
        padding: 8px;
        background: #1a102a;
        color: #fff;
    }
    #commentInput.input::placeholder {
        color: #bfaaff;
        opacity: 1;
    }
    .comment-actions {
        display: inline-flex;
        gap: 4px;
        margin-left: 10px;
    }
    .btn-delete-comment {
        background: none;
        border: none;
        color: #bfaaff;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 16px;
        transition: color 0.2s;
    }
    .btn-delete-comment:hover {
        color: #ef4444;
    }
    #commentForm {
        display: flex;
        gap: 8px;
        margin-top: 10px;
    }
    #commentForm input[type="text"], #commentInput.input {
        flex: 1;
        background: #1a102a;
        color: #fff;
        border: 1px solid #8b5cf6;
        border-radius: 6px;
        padding: 8px;
    }
    #commentForm button {
        background: #8b5cf6;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    #commentForm button:hover {
        background: #a78bfa;
    }
    #commentForm button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .loading {
        color: #bfaaff;
        text-align: center;
        padding: 12px;
        font-style: italic;
    }
`;
document.head.appendChild(commentsStyle);

    // ...existing code...

    // Evento para el botón de ver perfil
    if (viewProfileButtonHTML) {
        setTimeout(() => {
            const btnViewCreatorProfile = document.getElementById('btnViewCreatorProfile');
            if (btnViewCreatorProfile) {
                btnViewCreatorProfile.onclick = () => viewUserProfile(playlist.usuario.usuario, playlist.usuario.nombre, playlist.usuario.profileImageUrl);
            }
        }, 0);
    }

    modal.style.display = 'block';
    selectedPlaylistForSongs = playlist.id;
// Mostrar perfil del usuario creador de la playlist (mejorado)
async function viewUserProfile(usuario, nombre, profileImageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${usuario}`);
        if (!response.ok) {
            showMessage('No se pudo cargar el perfil del usuario', 'error');
            return;
        }
        const user = await response.json();
        // Imagen de perfil o emoji
        let avatarHtml = '';
        if (user.profileImageUrl && isValidUrl(user.profileImageUrl)) {
            avatarHtml = `<img src="${user.profileImageUrl}" alt="Avatar" class="profile-avatar-modal">`;
        } else {
            const initial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '👤';
            avatarHtml = `<div class="profile-avatar-modal profile-avatar-emoji">${initial}</div>`;
        }
        // Botón de seguir (no mostrar si ya es el usuario actual)
        let followBtn = '';
        if (currentUser && user.usuario !== currentUser.usuario) {
            followBtn = `<button class="btn-secondary" id="btnFollowCreatorModal">
                <span class="material-icons">person_add</span> Seguir
            </button>`;
        }
        let html = `<div class="user-profile-modal-content">
            <div class="profile-avatar-modal-container">${avatarHtml}</div>
            <h3>${user.nombre}</h3>
            <p><b>Usuario:</b> ${user.usuario}</p>
            <p><b>Email:</b> ${user.email || 'No disponible'}</p>
            <p><b>Carrera:</b> ${user.carrera || 'No disponible'}</p>
            ${followBtn}
            <button class="btn-secondary" id="btnCloseUserProfileModal">Cerrar</button>
        </div>`;
        let modal = document.getElementById('userProfileModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'userProfileModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content">${html}</div>`;
            document.body.appendChild(modal);
        } else {
            modal.innerHTML = `<div class="modal-content">${html}</div>`;
        }
        modal.style.display = 'block';
        // Evento cerrar
        setTimeout(() => {
            const btnClose = document.getElementById('btnCloseUserProfileModal');
            if (btnClose) btnClose.onclick = closeUserProfileModal;
            const btnFollow = document.getElementById('btnFollowCreatorModal');
            if (btnFollow) btnFollow.onclick = () => followUser(user.usuario, user.nombre);
        }, 0);
    } catch (e) {
        showMessage('Error al cargar perfil', 'error');
    }
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.style.display = 'none';
}

// Seguir usuario
async function followUser(usuario, nombre) {
    try {
        // Enviar el usuario que sigue (follower) en el body como JSON
        const response = await fetch(`${API_BASE_URL}/users/${usuario}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ follower: currentUser.usuario })
        });
        if (response.ok) {
            showMessage(`Ahora sigues a ${nombre}`, 'success');
            // Actualizar contadores de seguidores y siguiendo
            if (typeof loadUserStats === 'function') loadUserStats();
        } else {
            const error = await response.text();
            showMessage(error || 'No se pudo seguir al usuario', 'error');
        }
    } catch (e) {
        showMessage('Error de conexión al seguir usuario', 'error');
    }
}
// Estilos para el modal de perfil de usuario
const userProfileModalStyle = document.createElement('style');
userProfileModalStyle.textContent = `
    .user-profile-modal-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px 16px 16px;
        min-width: 280px;
    }
    .profile-avatar-modal-container {
        margin-bottom: 12px;
    }
    .profile-avatar-modal {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        background: #f3f3f3;
        display: block;
    }
    .profile-avatar-emoji {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--spotify-purple), var(--distrital-gold));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
`;
document.head.appendChild(userProfileModalStyle);
}

// ✅ FUNCIÓN PARA MOSTRAR MODAL DE AGREGAR CANCIONES - CORREGIDA
async function showAddSongsModal(playlistId) {
    try {
        // Cargar todas las canciones disponibles
        const response = await fetch(`${API_BASE_URL}/music`);
        if (!response.ok) {
            showMessage('Error cargando canciones', 'error');
            return;
        }

        const allSongs = await response.json();
        
        // Filtrar canciones que NO están en la playlist actual
        const currentSongIds = currentPlaylistSongs.map(song => song.id);
        const availableSongs = allSongs.filter(song => !currentSongIds.includes(song.id));

        // Verificar si hay canciones disponibles para agregar
        if (availableSongs.length === 0) {
            showMessage('No hay más canciones disponibles para agregar a esta playlist', 'info');
            return;
        }

        // Crear modal dinámico
        const modalHTML = `
            <div id="addSongsModal" class="modal" style="display: block;">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>Agregar Canciones a la Playlist</h3>
                        <span class="close" onclick="closeAddSongsModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="search-container">
                            <input type="text" id="songSearchInput" placeholder="Buscar canciones..." class="search-input">
                        </div>
                        <div class="songs-info">
                            <p>Canciones disponibles: ${availableSongs.length}</p>
                        </div>
                        <div class="available-songs">
                            ${availableSongs.map(song => `
                                <div class="song-item selectable" data-song-id="${song.id}">
                                    <div class="song-cover">
                                        ${song.imageUrl ?
                                            `<img src="${song.imageUrl}" alt="${song.titulo}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;">` :
                                            '<div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--spotify-purple), var(--distrital-gold)); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">🎵</div>'
                                        }
                                    </div>
                                    <div class="song-info">
                                        <h5>${song.titulo}</h5>
                                        <p>${song.artista} - ${song.album}</p>
                                    </div>
                                    <button class="btn-add-song" onclick="addSongToPlaylist(${playlistId}, ${song.id}, this)" data-song-id="${song.id}">
                                        <span class="material-icons">add</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Agregar funcionalidad de búsqueda
        const searchInput = document.getElementById('songSearchInput');
        searchInput.addEventListener('input', filterSongs);

    } catch (error) {
        console.error('❌ Error loading songs:', error);
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA FILTRAR CANCIONES
function filterSongs() {
    const query = document.getElementById('songSearchInput').value.toLowerCase();
    const songItems = document.querySelectorAll('.song-item.selectable');

    songItems.forEach(item => {
        const title = item.querySelector('h5').textContent.toLowerCase();
        const artist = item.querySelector('p').textContent.toLowerCase();

        if (title.includes(query) || artist.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ✅ FUNCIÓN PARA AGREGAR CANCIÓN A PLAYLIST - CORREGIDA
async function addSongToPlaylist(playlistId, songId, buttonElement) {
    try {
        // Verificar si la canción ya está en la playlist
        const isAlreadyAdded = currentPlaylistSongs.some(song => song.id === songId);
        if (isAlreadyAdded) {
            showMessage('Esta canción ya está en la playlist', 'info');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
            method: 'POST'
        });

        if (response.ok) {
            showMessage('Canción agregada exitosamente', 'success');
            
            // Actualizar el botón
            buttonElement.innerHTML = '<span class="material-icons">check</span>';
            buttonElement.disabled = true;
            buttonElement.classList.add('added');
            buttonElement.style.backgroundColor = '#10b981';
            buttonElement.style.color = 'white';
            
            // Ocultar la canción de la lista disponible
            const songItem = buttonElement.closest('.song-item');
            songItem.style.display = 'none';
            
            // Recargar las canciones de la playlist actual
            await refreshCurrentPlaylistSongs(playlistId);
            
        } else {
            const errorText = await response.text();
            if (errorText.includes('ya existe') || errorText.includes('duplicate')) {
                showMessage('Esta canción ya está en la playlist', 'info');
            } else {
                showMessage(errorText || 'Error agregando canción', 'error');
            }
        }
    } catch (error) {
        console.error('❌ Error adding song to playlist:', error);
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA REFRESCAR CANCIONES DE PLAYLIST ACTUAL
async function refreshCurrentPlaylistSongs(playlistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`);
        if (response.ok) {
            currentPlaylistSongs = await response.json();
        }
    } catch (error) {
        console.error('❌ Error refreshing playlist songs:', error);
    }
}

// ✅ FUNCIÓN PARA REMOVER CANCIÓN DE PLAYLIST - CORREGIDA
async function removeSongFromPlaylist(playlistId, songId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Canción eliminada exitosamente', 'success');
            
            // Remover la canción del array local
            currentPlaylistSongs = currentPlaylistSongs.filter(song => song.id !== songId);
            
            // Remover visualmente el elemento de la lista SIN recargar todo el modal
            const songElement = document.querySelector(`[data-song-id="${songId}"]`);
            if (songElement) {
                songElement.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    songElement.remove();
                    
                    // Actualizar el contador de canciones
                    const songsHeader = document.querySelector('.playlist-songs h4');
                    if (songsHeader) {
                        songsHeader.textContent = `Canciones (${currentPlaylistSongs.length})`;
                    }
                    
                    // Si no quedan canciones, mostrar mensaje vacío
                    if (currentPlaylistSongs.length === 0) {
                        const songsList = document.querySelector('.songs-list');
                        if (songsList) {
                            songsList.innerHTML = '<div class="empty-songs"><p>Esta playlist no tiene canciones aún</p></div>';
                        }
                    }
                }, 300);
            }
            
        } else {
            const errorData = await response.text();
            showMessage(errorData || 'Error eliminando canción', 'error');
        }
    } catch (error) {
        console.error('❌ Error removing song from playlist:', error);
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA CERRAR MODAL DE AGREGAR CANCIONES
function closeAddSongsModal() {
    const modal = document.getElementById('addSongsModal');
    if (modal) {
        modal.remove();
    }
}

// ✅ FUNCIÓN PARA BUSCAR CANCIONES
async function searchSongs() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (!query) {
        resultsContainer.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/music/search?query=${encodeURIComponent(query)}`);

        if (response.ok) {
            const songs = await response.json();
            renderSearchResults(songs, resultsContainer);
        } else {
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
            <div class="result-cover">
                ${song.imageUrl ?
                    `<img src="${song.imageUrl}" alt="${song.titulo}" style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover;">` :
                    '<div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--spotify-purple), var(--distrital-gold)); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">🎵</div>'
                }
            </div>
            <div class="result-info">
                <h4>${song.titulo}</h4>
                <p>${song.artista} - ${song.album}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <h4>Resultados de búsqueda:</h4>
        <div class="search-results-list">
            ${songsHTML}
        </div>
    `;
}

// ✅ FUNCIÓN PARA SELECCIONAR CANCIÓN
function selectSong(songId) {
    showMessage(`Canción seleccionada. Funcionalidad en desarrollo para reproducir.`, 'info');
}


// ✅ FUNCIÓN PARA CREAR PLAYLIST
async function createPlaylist(playlistData) {
    try {
        const requestData = {
            ...playlistData,
            usuario: currentUser
        };
        const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        if (response.ok) {
            const newPlaylist = await response.json();
            showMessage('¡Playlist creada exitosamente!', 'success');
            loadMyPlaylists();
            return newPlaylist;
        } else {
            const errorData = await response.text();
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
    const playlistImage = document.getElementById('playlistImage').value.trim();
    const isPublic = document.getElementById('isPublic').checked;

    if (!playlistName) {
        showMessage('El nombre de la playlist es obligatorio', 'error');
        return;
    }

    // Validar URL de imagen si se proporciona
    if (playlistImage && !isValidUrl(playlistImage)) {
        showMessage('La URL de la imagen no es válida', 'error');
        return;
    }

    const playlistData = {
        nombre: playlistName,
        esPublica: isPublic,
        imageUrl: playlistImage || null
    };

    createPlaylist(playlistData).then(result => {
        if (result) {
            document.getElementById('playlistModal').style.display = 'none';
            document.getElementById('playlistForm').reset();
        }
    });
}

// ✅ FUNCIÓN PARA VALIDAR URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ✅ FUNCIÓN PARA NAVEGACIÓN
function showSection(sectionName) {
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

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES - MEJORADA
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

// Agregar CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.95);
        }
    }

    .btn-add-song.added {
        background-color: #10b981 !important;
        color: white !important;
        cursor: not-allowed;
    }

    .song-item {
        transition: all 0.3s ease;
    }

    .songs-info {
        margin-bottom: 15px;
        color: #888;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// ✅ INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando DistriMusic Dashboard...');

    // Verificar autenticación
    if (!checkAuthentication()) {
        return;
    }

    // Cargar información del usuario
    loadUserInfo();
    loadUserStats();
    loadMyPlaylists();

    // EVENT LISTENERS

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
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Crear playlist
    const btnCreatePlaylist = document.getElementById('btnCreatePlaylist');
    if (btnCreatePlaylist) {
        btnCreatePlaylist.addEventListener('click', () => {
            document.getElementById('playlistModal').style.display = 'block';
        });
    }

    // Modal playlist
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

    if (playlistModal) {
        playlistModal.addEventListener('click', (e) => {
            if (e.target === playlistModal) {
                playlistModal.style.display = 'none';
            }
        });
    }

    // Modal detalles de playlist
    const detailModal = document.getElementById('playlistDetailModal');
    const closeDetailModal = document.getElementById('closeDetailModal');

    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', () => {
            detailModal.style.display = 'none';
            // Limpiar contenido dinámico
            const dynamicContent = detailModal.querySelectorAll('.playlist-songs, .playlist-actions, .empty-songs');
            dynamicContent.forEach(el => el.remove());
        });
    }

    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.style.display = 'none';
                // Limpiar contenido dinámico
                const dynamicContent = detailModal.querySelectorAll('.playlist-songs, .playlist-actions, .empty-songs');
                dynamicContent.forEach(el => el.remove());
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

    // Botones para ver seguidores y siguiendo
    const btnVerSeguidores = document.getElementById('btnVerSeguidores');
    if (btnVerSeguidores) {
        btnVerSeguidores.addEventListener('click', () => showUserListModal('followers'));
    }
    const btnVerSiguiendo = document.getElementById('btnVerSiguiendo');
    if (btnVerSiguiendo) {
        btnVerSiguiendo.addEventListener('click', () => showUserListModal('following'));
    }

    console.log('✅ Dashboard inicializado correctamente');
});
function showProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) {
        console.error('Modal de perfil no encontrado');
        return;
    }

    // Cargar datos actuales del usuario
    loadCurrentUserData();
    
    // Mostrar modal
    modal.style.display = 'block';
}

// ✅ FUNCIÓN PARA CARGAR DATOS ACTUALES DEL USUARIO
function loadCurrentUserData() {
    if (!currentUser) return;

    // Cargar información básica
    document.getElementById('editUserName').value = currentUser.nombre || '';
    document.getElementById('editUserCareer').value = currentUser.carrera || '';
    document.getElementById('editUserEmail').value = currentUser.email || '';
    document.getElementById('profileImageUrl').value = currentUser.profileImageUrl || '';

    // Actualizar avatar
    updateAvatarPreview(currentUser.profileImageUrl);

    // Cargar estadísticas
    loadUserStatistics();
}

// ✅ FUNCIÓN PARA ACTUALIZAR PREVIEW DEL AVATAR
function updateAvatarPreview(imageUrl) {
    const avatarContainer = document.getElementById('currentAvatar');
    
    if (imageUrl && isValidUrl(imageUrl)) {
        avatarContainer.innerHTML = `<img src="${imageUrl}" alt="Avatar" class="image-preview">`;
    } else {
        // Mostrar emoji o inicial del usuario
        const initial = currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : '👤';
        avatarContainer.innerHTML = `<span class="material-icons">account_circle</span>`;
    }
}

// ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS DEL USUARIO
async function loadUserStatistics() {
    if (!currentUser) return;

    try {
        // Cargar número de playlists
        const playlistsResponse = await fetch(`${API_BASE_URL}/playlists/user/${currentUser.usuario}`);
        if (playlistsResponse.ok) {
            const playlists = await playlistsResponse.json();
            document.getElementById('userPlaylistsCount').textContent = playlists.length;
        }

        // Cargar seguidores
        try {
            const followersResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/followers`);
            if (followersResponse.ok) {
                const followers = await followersResponse.json();
                document.getElementById('userFollowersCount').textContent = followers.length;
            }
        } catch (error) {
            document.getElementById('userFollowersCount').textContent = '0';
        }

        // Cargar siguiendo
        try {
            const followingResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/following`);
            if (followingResponse.ok) {
                const following = await followingResponse.json();
                document.getElementById('userFollowingCount').textContent = following.length;
            }
        } catch (error) {
            document.getElementById('userFollowingCount').textContent = '0';
        }

        // Fecha de registro (si está disponible)
        const joinDate = currentUser.fechaRegistro ? 
            new Date(currentUser.fechaRegistro).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'short' 
            }) : 'No disponible';
        document.getElementById('userJoinDate').textContent = joinDate;

    } catch (error) {
        console.error('❌ Error loading user statistics:', error);
    }
}

// ✅ FUNCIÓN PARA MANEJAR CAMBIOS EN LA URL DE LA IMAGEN
function handleProfileImageChange() {
    const imageUrl = document.getElementById('profileImageUrl').value.trim();
    updateAvatarPreview(imageUrl);
}

// ✅ FUNCIÓN PARA QUITAR FOTO DE PERFIL
function removeProfileImage() {
    document.getElementById('profileImageUrl').value = '';
    updateAvatarPreview('');
}

// ✅ FUNCIÓN PARA VALIDAR CONTRASEÑA
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Mínimo ${minLength} caracteres`);
    }
    if (!hasUpperCase) {
        errors.push('Una letra mayúscula');
    }
    if (!hasLowerCase) {
        errors.push('Una letra minúscula');
    }
    if (!hasNumbers) {
        errors.push('Un número');
    }
    if (!hasSpecialChar) {
        errors.push('Un carácter especial');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ✅ FUNCIÓN PARA MOSTRAR ERRORES EN CAMPOS
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    // Remover error anterior
    if (existingError) {
        existingError.remove();
    }

    // Agregar nueva clase de error
    field.classList.add('error');
    field.classList.remove('success');

    // Agregar mensaje de error
    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

// ✅ FUNCIÓN PARA MOSTRAR ÉXITO EN CAMPOS
function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    // Remover error anterior
    if (existingError) {
        existingError.remove();
    }

    // Agregar clase de éxito
    field.classList.remove('error');
    field.classList.add('success');
}

// ✅ FUNCIÓN PARA LIMPIAR ESTADO DE CAMPO
function clearFieldState(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }

    field.classList.remove('error', 'success');
}

// ✅ FUNCIÓN PARA MANEJAR ENVÍO DEL FORMULARIO DE PERFIL
async function handleProfileFormSubmit(event) {
    event.preventDefault();

    const formData = {
        nombre: document.getElementById('editUserName').value.trim(),
        carrera: document.getElementById('editUserCareer').value.trim(),
        email: document.getElementById('editUserEmail').value.trim(),
        profileImageUrl: document.getElementById('profileImageUrl').value.trim()
    };

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Limpiar estados anteriores
    ['editUserName', 'editUserCareer', 'editUserEmail', 'profileImageUrl', 'newPassword', 'confirmPassword'].forEach(clearFieldState);

    let hasErrors = false;

    // Validar campos obligatorios SOLO si están vacíos
    if (!formData.nombre) {
        showFieldError('editUserName', 'El nombre es obligatorio');
        hasErrors = true;
    }
    if (!formData.carrera) {
        showFieldError('editUserCareer', 'La carrera es obligatoria');
        hasErrors = true;
    }
    if (!formData.email) {
        showFieldError('editUserEmail', 'El email es obligatorio');
        hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showFieldError('editUserEmail', 'Email no válido');
        hasErrors = true;
    }
    // Validar URL de imagen si se proporciona
    if (formData.profileImageUrl && !isValidUrl(formData.profileImageUrl)) {
        showFieldError('profileImageUrl', 'URL de imagen no válida');
        hasErrors = true;
    }

    // Validar cambio de contraseña SOLO si se intenta cambiar
    if (newPassword || confirmPassword) {
        if (!newPassword) {
            showFieldError('newPassword', 'Ingresa la nueva contraseña');
            hasErrors = true;
        } else {
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                showFieldError('newPassword', `Falta: ${passwordValidation.errors.join(', ')}`);
                hasErrors = true;
            }
        }
        if (newPassword !== confirmPassword) {
            showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            hasErrors = true;
        }
    }

    if (hasErrors) {
        showMessage('Por favor corrige los errores antes de continuar', 'error');
        return;
    }

    // Mostrar estado de carga
    const avatarSection = document.querySelector('.profile-avatar-section');
    avatarSection.classList.add('loading');

    try {
        // Actualizar información básica
        const updateData = {
            ...currentUser,
            ...formData
        };

        // Solo incluir cambio de contraseña si se está cambiando
        if (newPassword) {
            updateData.newPassword = newPassword;
        }

        // Enviar solo los datos necesarios
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            // Actualizar usuario actual
            currentUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Actualizar UI
            loadUserInfo();
            updateAvatarPreview(currentUser.profileImageUrl);
            // Mostrar éxito
            showMessage('Perfil actualizado exitosamente', 'success');
            // Cerrar modal después de un delay
            setTimeout(() => {
                document.getElementById('profileModal').style.display = 'none';
            }, 1500);
        } else {
            const errorData = await response.text();
            showMessage(errorData || 'Error al actualizar perfil', 'error');
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showMessage('Error de conexión', 'error');
    } finally {
        // Quitar estado de carga
        avatarSection.classList.remove('loading');
    }
}

// ✅ FUNCIÓN PARA CERRAR MODAL DE PERFIL
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    
    // Limpiar formulario
    document.getElementById('profileForm').reset();
    
    // Limpiar estados de validación
    ['editUserName', 'editUserCareer', 'editUserEmail', 'profileImageUrl', 'newPassword', 'confirmPassword'].forEach(clearFieldState);
}

// ✅ AGREGAR EVENT LISTENERS AL FINAL DEL DOMContentLoaded EN dashboard.js

// Event listeners para modal de perfil
const btnProfile = document.getElementById('btnProfile');
if (btnProfile) {
    btnProfile.addEventListener('click', showProfileModal);
}

// Modal de perfil
const profileModal = document.getElementById('profileModal');
const closeProfileBtn = document.getElementById('closeProfileModal');
const cancelProfileEdit = document.getElementById('cancelProfileEdit');

if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closeProfileModal);
}

if (cancelProfileEdit) {
    cancelProfileEdit.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
}

if (profileModal) {
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
}

// Formulario de perfil
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', handleProfileFormSubmit);
}

// Preview de imagen en tiempo real
const profileImageUrl = document.getElementById('profileImageUrl');
if (profileImageUrl) {
    profileImageUrl.addEventListener('input', handleProfileImageChange);
}

// Botón para quitar imagen
const removeProfileImageBtn = document.getElementById('removeProfileImage');
if (removeProfileImageBtn) {
    removeProfileImageBtn.addEventListener('click', removeProfileImage);
}

// FUNCIONES GLOBALES
window.viewPlaylistDetails = viewPlaylistDetails;
window.selectSong = selectSong;
window.showSection = showSection;
window.showAddSongsModal = showAddSongsModal;
window.addSongToPlaylist = addSongToPlaylist;
window.removeSongFromPlaylist = removeSongFromPlaylist;
window.closeAddSongsModal = closeAddSongsModal;