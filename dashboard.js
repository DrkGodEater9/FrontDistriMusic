// DistriMusic - Dashboard JavaScript CORREGIDO

// URL base de la API
const API_BASE_URL = 'http://localhost:8090/api';

// Variable global para el usuario actual
let currentUser = null;
let selectedPlaylistForSongs = null;
let currentPlaylistSongs = []; // Array para mantener las canciones actuales de la playlist

// ✅ FUNCIÓN PARA VERIFICAR AUTENTICACIÓN
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('currentUser');

    if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
        window.location.href = 'auth.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');

    showMessage('Sesión cerrada exitosamente', 'success');

    setTimeout(() => {
        window.location.href = 'auth.html';
    }, 1000);
}

// ✅ FUNCIÓN PARA CARGAR ESTADÍSTICAS
/**
 * Carga las estadísticas del usuario actual
 * @async
 * @returns {Promise<void>}
 * @description Obtiene el número de seguidores y seguidos del usuario actual
 * y actualiza los contadores en la interfaz
 */
async function loadUserStats() {
    if (!currentUser) return;

    try {
        // Cargar seguidores
        const seguidoresResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/followers`);
        if (seguidoresResponse.ok) {
            const seguidores = await seguidoresResponse.json();
            document.getElementById('statSeguidores').textContent = seguidores.length;
            window._userFollowersList = seguidores;
        }

        // Cargar siguiendo
        const siguiendoResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/following`);
        if (siguiendoResponse.ok) {
            const siguiendo = await siguiendoResponse.json();
            document.getElementById('statSiguiendo').textContent = siguiendo.length;
            window._userFollowingList = siguiendo;
        }

    } catch (error) {
        showMessage('Error al cargar estadísticas de usuario', 'error');
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MODAL DE DETALLES DE PLAYLIST - COMPLETAMENTE REESTRUCTURADA
function showPlaylistDetailModal(playlist, songs) {
    const modal = document.getElementById('playlistDetailModal');
    const titleElement = document.getElementById('detailPlaylistName');
    const ownerElement = document.getElementById('detailPlaylistOwner');
    const dateElement = document.getElementById('detailPlaylistDate');
    const typeElement = document.getElementById('detailPlaylistType');

    // Limpiar contenido dinámico anterior
    const contentArea = modal.querySelector('.playlist-detail-content');
    const existingSongs = contentArea.querySelectorAll('.playlist-songs, .playlist-actions, .empty-songs, .playlist-section-divider, #commentsSection');
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
    ` : '<div class="empty-songs"><h3>Esta playlist no tiene canciones aún</h3><p>Agrega algunas canciones para comenzar</p></div>';

    // Botón para agregar canciones si es el propietario
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

    // Sección de comentarios (SIEMPRE mostrada para playlists públicas)
    const commentsSection = playlist.esPublica ? `
        <div class="playlist-section-divider"></div>
        <div id="commentsSection" style="display: block;">
            <div class="comments-title">
                <span class="material-icons">comment</span>
                Comentarios
            </div>
            <div id="commentsList">
                <div class="loading">Cargando comentarios...</div>
            </div>
            <form id="commentForm" style="margin-top: 16px; display: flex; gap: 8px;">
                <input type="text" id="commentInput" class="comment-input" placeholder="Escribe un comentario..." maxlength="500" style="flex: 1;">
                <button type="submit" class="btn-primary">
                    <span class="material-icons">send</span>
                    Comentar
                </button>
            </form>
        </div>
    ` : '';

    // Insertar todo el contenido
    const existingPlaylistInfo = contentArea.querySelector('.playlist-info');
    if (existingPlaylistInfo) {
        existingPlaylistInfo.insertAdjacentHTML('afterend',
            songsHTML + 
            addSongsButton + 
            viewProfileButtonHTML + 
            commentsSection
        );
    }

    // Configurar eventos después de insertar el HTML
    setTimeout(() => {
        // Evento para el botón de ver perfil
        const btnViewCreatorProfile = document.getElementById('btnViewCreatorProfile');
        if (btnViewCreatorProfile) {
            btnViewCreatorProfile.onclick = () => viewUserProfile(playlist.usuario.usuario, playlist.usuario.nombre, playlist.usuario.profileImageUrl);
        }

        // Configurar comentarios si la playlist es pública
        if (playlist.esPublica) {
            loadCommentsForPlaylist(playlist.id);
            
            const commentForm = document.getElementById('commentForm');
            if (commentForm) {
                commentForm.onsubmit = function(e) {
                    e.preventDefault();
                    submitComment(playlist.id);
                };
            }
        }
    }, 100);

    modal.style.display = 'block';
    selectedPlaylistForSongs = playlist.id;
}


/**
 * Carga y muestra los detalles completos de una playlist
 * @async
 * @param {number} playlistId - ID de la playlist a visualizar
 * @throws {Error} Si hay problemas al cargar los datos
 * @returns {Promise<void>}
 * @description Obtiene toda la información de una playlist incluyendo sus canciones
 * y la muestra en un modal detallado
 */
async function viewPlaylistDetails(playlistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`);
        if (!response.ok) {
            throw new Error('Error cargando detalles de playlist');
        }
        const playlist = await response.json();
        // ...resto del código existente
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error cargando detalles', 'error');
    }
}



/**
 * Carga los comentarios asociados a una playlist específica
 * @async
 * @param {number} playlistId - ID de la playlist para cargar sus comentarios
 * @throws {Error} Si hay problemas de conexión con el servidor
 * @returns {Promise<void>}
 * @description Realiza una petición al backend para obtener todos los comentarios
 * asociados a una playlist y los muestra en la interfaz
 */
async function loadCommentsForPlaylist(playlistId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.innerHTML = '<div class="loading">Cargando comentarios...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/playlist/${playlistId}`);
        
        if (response.ok) {
            const comments = await response.json();
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="empty-comments">Sé el primero en comentar esta playlist.</div>';
            } else {
                // Ordenar comentarios por fecha de creación (más antiguos primero)
                const sortedComments = comments.sort((a, b) => {
                    const dateA = new Date(a.fechaComentario || 0);
                    const dateB = new Date(b.fechaComentario || 0);
                    return dateA - dateB; // Orden ascendente (más antiguos primero)
                });
                
                commentsList.innerHTML = sortedComments.map(comment => {
                    const isOwner = currentUser && comment.usuario && comment.usuario.usuario === currentUser.usuario;
                    const commentDate = comment.fechaComentario ? 
                        new Date(comment.fechaComentario).toLocaleString('es-ES') : '';
                    
                    return `
                        <div class="comment-item" data-comment-id="${comment.id}">
                            <div class="comment-header">
                                <span class="comment-user">${comment.usuario?.nombre || comment.usuario?.usuario || 'Usuario'}</span>
                                <span class="comment-date">${commentDate}</span>
                                ${isOwner ? `
                                    <button class="btn-delete-comment" title="Eliminar" onclick="deleteComment(${comment.id}, ${playlistId})">
                                        <span class="material-icons">delete</span>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="comment-content">${comment.contenido}</div>
                        </div>
                    `;
                }).join('');
                
                // Hacer scroll hacia abajo para mostrar los comentarios más recientes
                setTimeout(() => {
                    commentsList.scrollTop = commentsList.scrollHeight;
                }, 100);
            }
        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            
            if (response.status === 404) {
                commentsList.innerHTML = '<div class="empty-comments error">La playlist no existe o fue eliminada.</div>';
            } else if (response.status === 403) {
                commentsList.innerHTML = '<div class="empty-comments error">No tienes permiso para ver los comentarios.</div>';
            } else {
                commentsList.innerHTML = '<div class="empty-comments error">No se pudieron cargar los comentarios.</div>';
            }
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        commentsList.innerHTML = '<div class="empty-comments error">Error de conexión al cargar comentarios.</div>';
    }
}

// ✅ FUNCIÓN PARA ENVIAR COMENTARIO - CORREGIDA (AÑADIR AL FINAL)
/**
 * Envía un nuevo comentario para una playlist
 * @async
 * @param {number} playlistId - ID de la playlist donde se añadirá el comentario
 * @throws {Error} Si hay errores en la validación o problemas de conexión
 * @returns {Promise<void>}
 * @description Valida y envía un nuevo comentario al backend, actualiza la interfaz
 * si la operación es exitosa
 */
async function submitComment(playlistId) {
    const input = document.getElementById('commentInput');
    const submitButton = document.querySelector('#commentForm button[type="submit"]');
    
    if (!input || !input.value.trim()) {
        showMessage('Por favor escribe un comentario', 'error');
        return;
    }
    
    const contenido = input.value.trim();
    
    // Deshabilitar campos durante el envío
    input.disabled = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-icons">hourglass_empty</span> Enviando...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/playlist/${playlistId}?usuario=${encodeURIComponent(currentUser.usuario)}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contenido })
        });

        if (response.ok) {
            const newComment = await response.json();
            input.value = '';
            showMessage('Comentario agregado exitosamente', 'success');
            
            // Agregar el nuevo comentario al final de la lista (sin recargar todos)
            addNewCommentToList(newComment, playlistId);
            
        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            
            if (response.status === 404) {
                showMessage('La playlist no existe o fue eliminada', 'error');
            } else if (response.status === 403) {
                showMessage('No tienes permiso para comentar en esta playlist', 'error');
            } else {
                showMessage(errorText || 'No se pudo enviar el comentario', 'error');
            }
        }
    } catch (error) {
        console.error('Error al enviar comentario:', error);
        showMessage('Error de conexión: ' + error.message, 'error');
    } finally {
        // Rehabilitar campos
        input.disabled = false;
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-icons">send</span> Comentar';
    }
}

function addNewCommentToList(comment, playlistId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    // Si no hay comentarios, limpiar el mensaje vacío
    const emptyMessage = commentsList.querySelector('.empty-comments');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    const isOwner = currentUser && comment.usuario && comment.usuario.usuario === currentUser.usuario;
    const commentDate = comment.fechaComentario ? 
        new Date(comment.fechaComentario).toLocaleString('es-ES') : '';
    
    const commentHTML = `
        <div class="comment-item new-comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <span class="comment-user">${comment.usuario?.nombre || comment.usuario?.usuario || 'Usuario'}</span>
                <span class="comment-date">${commentDate}</span>
                ${isOwner ? `
                    <button class="btn-delete-comment" title="Eliminar" onclick="deleteComment(${comment.id}, ${playlistId})">
                        <span class="material-icons">delete</span>
                    </button>
                ` : ''}
            </div>
            <div class="comment-content">${comment.contenido}</div>
        </div>
    `;
    
    // Agregar al final de la lista
    commentsList.insertAdjacentHTML('beforeend', commentHTML);
    
    // Hacer scroll suave hacia el nuevo comentario
    setTimeout(() => {
        const newCommentElement = commentsList.querySelector('.new-comment');
        if (newCommentElement) {
            newCommentElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
            
            // Remover la clase después de la animación
            setTimeout(() => {
                newCommentElement.classList.remove('new-comment');
            }, 1000);
        }
    }, 100);
}

// ✅ FUNCIÓN PARA ELIMINAR COMENTARIO - CORREGIDA
/**
 * Elimina un comentario de una playlist
 * @async
 * @param {number} commentId - ID del comentario a eliminar
 * @param {number} playlistId - ID de la playlist que contiene el comentario
 * @throws {Error} Si hay problemas de conexión o permisos
 * @returns {Promise<void>}
 * @description Solicita confirmación al usuario y envía la petición de eliminación al backend
 */
window.deleteComment = async function(commentId, playlistId) {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}?usuario=${encodeURIComponent(currentUser.usuario)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Comentario eliminado', 'success');
            loadCommentsForPlaylist(playlistId);
        } else {
            const errorText = await response.text();
            showMessage(errorText || 'No se pudo eliminar el comentario', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        showMessage('Error de conexión', 'error');
    }
};

// ✅ FUNCIÓN PARA VER DETALLES DE PLAYLIST CON CANCIONES
/**
 * Carga y muestra los detalles completos de una playlist
 * @async
 * @param {number} playlistId - ID de la playlist a visualizar
 * @throws {Error} Si hay problemas al cargar los datos
 * @returns {Promise<void>}
 * @description Obtiene toda la información de una playlist incluyendo sus canciones
 * y la muestra en un modal detallado
 */
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
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MODAL DE AGREGAR CANCIONES - MEJORADA
/**
 * Muestra el modal para agregar canciones a una playlist
 * @async
 * @param {number} playlistId - ID de la playlist a la que se agregarán canciones
 * @returns {Promise<void>}
 * @description Carga todas las canciones disponibles que no están en la playlist
 * y las muestra en un modal con opciones de filtrado y búsqueda
 */
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
                        <h3>🎵 Agregar Canciones a la Playlist</h3>
                        <span class="close" onclick="closeAddSongsModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="search-container">
                            <input type="text" id="songSearchInput" placeholder="🔍 Buscar canciones..." class="search-input">
                        </div>
                        <div class="songs-info">
                            <p>📀 Canciones disponibles: <strong>${availableSongs.length}</strong></p>
                        </div>
                        <div class="available-songs">
                            ${availableSongs.map(song => `
                                <div class="song-item selectable" data-song-id="${song.id}">
                                    <div class="song-cover">
                                        ${song.imageUrl ?
                                            `<img src="${song.imageUrl}" alt="${song.titulo}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">` :
                                            '<div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--spotify-purple), var(--distrital-gold)); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">🎵</div>'
                                        }
                                    </div>
                                    <div class="song-info">
                                        <h5>${song.titulo}</h5>
                                        <p>${song.artista} - ${song.album}</p>
                                    </div>
                                    <button class="btn-add-song" onclick="addSongToPlaylist(${playlistId}, ${song.id}, this)" data-song-id="${song.id}" title="Agregar a playlist">
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

// ✅ FUNCIÓN PARA AGREGAR CANCIÓN A PLAYLIST 
/**
 * Añade una canción a una playlist específica
 * @async
 * @param {number} playlistId - ID de la playlist
 * @param {number} songId - ID de la canción a añadir
 * @param {HTMLElement} buttonElement - Elemento botón que triggereó la acción
 * @throws {Error} Si hay problemas de conexión o la canción ya existe
 * @returns {Promise<void>}
 * @description Verifica duplicados y realiza la petición al backend para añadir la canción
 */
async function addSongToPlaylist(playlistId, songId, buttonElement) {
    try {
        // Verificar si la canción ya está en la playlist
        const isAlreadyAdded = currentPlaylistSongs.some(song => song.id === songId);
        if (isAlreadyAdded) {
            showMessage('Esta canción ya está en la playlist', 'info');
            return;
        }

        // Cambiar estado del botón inmediatamente
        buttonElement.innerHTML = '<span class="material-icons">hourglass_empty</span>';
        buttonElement.disabled = true;

        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
            method: 'POST'
        });

        if (response.ok) {
            showMessage('✅ Canción agregada exitosamente', 'success');
            
            // Actualizar el botón
            buttonElement.innerHTML = '<span class="material-icons">check</span>';
            buttonElement.classList.add('added');
            buttonElement.style.backgroundColor = '#10b981';
            buttonElement.style.color = 'white';
            
            // Ocultar la canción de la lista disponible con animación
            const songItem = buttonElement.closest('.song-item');
            songItem.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                songItem.style.display = 'none';
            }, 300);
            
            // Recargar las canciones de la playlist actual
            await refreshCurrentPlaylistSongs(playlistId);
            
        } else {
            const errorText = await response.text();
            if (errorText.includes('ya existe') || errorText.includes('duplicate')) {
                showMessage('Esta canción ya está en la playlist', 'info');
            } else {
                showMessage(errorText || 'Error agregando canción', 'error');
            }
            
            // Restaurar botón si hay error
            buttonElement.innerHTML = '<span class="material-icons">add</span>';
            buttonElement.disabled = false;
        }
    } catch (error) {
        console.error('❌ Error adding song to playlist:', error);
        showMessage('Error de conexión', 'error');
        
        // Restaurar botón si hay error
        buttonElement.innerHTML = '<span class="material-icons">add</span>';
        buttonElement.disabled = false;
    }
}

// ✅ FUNCIÓN PARA REFRESCAR CANCIONES DE PLAYLIST ACTUAL
/**
 * Actualiza la lista de canciones de la playlist actual
 * @async
 * @param {number} playlistId - ID de la playlist a actualizar
 * @returns {Promise<void>}
 * @description Refresca la lista de canciones de la playlist desde el servidor
 * para mantener sincronizada la vista con los datos más recientes
 */
async function refreshCurrentPlaylistSongs(playlistId) {
    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`);
        if (response.ok) {
            currentPlaylistSongs = await response.json();
        }
    } catch (error) {
        showMessage('Error al actualizar las canciones de la playlist', 'error');
    }
}

// ✅ FUNCIÓN PARA REMOVER CANCIÓN DE PLAYLIST - MEJORADA
/**
 * Elimina una canción de una playlist
 * @async
 * @param {number} playlistId - ID de la playlist
 * @param {number} songId - ID de la canción a eliminar
 * @throws {Error} Si hay problemas de conexión o permisos
 * @returns {Promise<void>}
 * @description Solicita confirmación y envía la petición de eliminación al backend
 */
async function removeSongFromPlaylist(playlistId, songId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta canción de la playlist?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('🗑️ Canción eliminada exitosamente', 'success');
            
            // Remover la canción del array local
            currentPlaylistSongs = currentPlaylistSongs.filter(song => song.id !== songId);
            
            // Remover visualmente el elemento de la lista con animación
            const songElement = document.querySelector(`[data-song-id="${songId}"]`);
            if (songElement) {
                songElement.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    songElement.remove();
                    
                    // Actualizar el contador de canciones
                    const songsHeader = document.querySelector('.playlist-songs-header h4');
                    if (songsHeader) {
                        songsHeader.textContent = `🎶 Canciones (${currentPlaylistSongs.length})`;
                    }
                    
                    // Si no quedan canciones, mostrar mensaje vacío
                    if (currentPlaylistSongs.length === 0) {
                        const songsSection = document.querySelector('.playlist-songs-section');
                        if (songsSection) {
                            songsSection.innerHTML = `
                                <div class="empty-songs">
                                    <h3>📭 Sin canciones</h3>
                                    <p>Esta playlist no tiene canciones aún. ¡Agrega algunas!</p>
                                </div>
                            `;
                        }
                    }
                }, 300);
            }
            
        } else {
            const errorData = await response.text();
            showMessage(errorData || 'Error eliminando canción', 'error');
        }
    } catch (error) {
        showMessage('Error de conexión', 'error');
    }
}

// ✅ FUNCIÓN PARA CERRAR MODAL DE AGREGAR CANCIONES
function closeAddSongsModal() {
    const modal = document.getElementById('addSongsModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
            
            // ✅ SOLO AGREGAR ESTA LÍNEA
            if (selectedPlaylistForSongs) {
                viewPlaylistDetails(selectedPlaylistForSongs);
            }
        }, 300);
    }
}

// ✅ RESTO DE FUNCIONES (se mantienen igual)
/**
 * Carga las playlists del usuario actual
 * @async
 * @returns {Promise<void>}
 * @description Obtiene todas las playlists creadas por el usuario actual
 * y las renderiza en la sección correspondiente
 */
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
        container.innerHTML = '<div class="empty-state"><h3>Error de conexión</h3></div>';
    }
}

/**
 * Carga todas las playlists públicas del sistema
 * @async
 * @returns {Promise<void>}
 * @description Obtiene las playlists marcadas como públicas de todos los usuarios
 * y las renderiza en la sección de exploración
 */
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


/**
 * Realiza una búsqueda de canciones en el sistema
 * @async
 * @throws {Error} Si hay problemas de conexión con el servidor
 * @returns {Promise<void>}
 * @description Obtiene el término de búsqueda del input y realiza la petición al backend,
 * mostrando los resultados en la interfaz
 */
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

function selectSong(songId) {
    showMessage(`🎵 Canción seleccionada. Funcionalidad en desarrollo para reproducir.`, 'info');
}

/**
 * Crea una nueva playlist en el sistema
 * @async
 * @param {Object} playlistData - Datos de la nueva playlist
 * @param {string} playlistData.nombre - Nombre de la playlist
 * @param {boolean} playlistData.esPublica - Indica si la playlist será pública
 * @param {string} [playlistData.imageUrl] - URL de la imagen de portada (opcional)
 * @throws {Error} Si hay problemas de validación o conexión
 * @returns {Promise<Object|null>} La playlist creada o null si hay error
 */
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
            showMessage('🎉 ¡Playlist creada exitosamente!', 'success');
            loadMyPlaylists();
            return newPlaylist;
        } else {
            const errorData = await response.text();
            showMessage(`❌ Error al crear playlist: ${errorData}`, 'error');
            return null;
        }
    } catch (error) {
        console.error('❌ Error creating playlist:', error);
        showMessage('🌐 Error de conexión al crear playlist', 'error');
        return null;
    }
}

function handleCreatePlaylist(event) {
    event.preventDefault();

    const playlistName = document.getElementById('playlistName').value.trim();
    const playlistImage = document.getElementById('playlistImage').value.trim();
    const isPublic = document.getElementById('isPublic').checked;

    if (!playlistName) {
        showMessage('❌ El nombre de la playlist es obligatorio', 'error');
        return;
    }

    // Validar URL de imagen si se proporciona
    if (playlistImage && !isValidUrl(playlistImage)) {
        showMessage('❌ La URL de la imagen no es válida', 'error');
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

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

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

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES
function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.dashboard-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `dashboard-message ${type}`;
    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️'}
            </span>
            <span>${message}</span>
        </div>
    `;

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 500;
        font-size: 14px;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            messageDiv.style.color = '#ffffff';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            messageDiv.style.color = '#ffffff';
            break;
        case 'info':
            messageDiv.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
            messageDiv.style.color = '#ffffff';
            break;
        default:
            messageDiv.style.background = 'linear-gradient(135deg, #535353 0%, #404040 100%)';
            messageDiv.style.color = '#ffffff';
    }

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 5000);
}

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

// ✅ MODAL PARA VER SEGUIDORES Y SIGUIENDO
function showUserListModal(type) {
    let users = [];
    let title = '';
    if (type === 'followers') {
        users = window._userFollowersList || [];
        title = '👥 Tus seguidores';
    } else {
        users = window._userFollowingList || [];
        title = '🔗 A quién sigues';
    }
    
    let html = `<div class="user-list-modal-content">
        <h3>${title}</h3>
        <ul class="user-list-modal-ul">
            ${users.length === 0 ? '<li style="text-align:center; color: var(--spotify-light-gray); padding: 20px;">No hay usuarios para mostrar</li>' : users.map(u => `
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

// ✅ MOSTRAR PERFIL DEL USUARIO CREADOR DE LA PLAYLIST
/**
 * Muestra el perfil detallado de un usuario
 * @async
 * @param {string} usuario - Nombre de usuario a visualizar
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} profileImageUrl - URL de la imagen de perfil
 * @returns {Promise<void>}
 * @description Carga y muestra la información detallada del perfil de un usuario
 * incluyendo sus datos personales y opciones para seguirlo
 */
async function viewUserProfile(usuario, nombre, profileImageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${usuario}`);
        if (!response.ok) {
            showMessage('❌ No se pudo cargar el perfil del usuario', 'error');
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
            followBtn = `<button class="btn-primary" id="btnFollowCreatorModal">
                <span class="material-icons">person_add</span> Seguir
            </button>`;
        }
        
        let html = `<div class="user-profile-modal-content">
            <div class="profile-avatar-modal-container">${avatarHtml}</div>
            <h3>${user.nombre}</h3>
            <p><b>👤 Usuario:</b> ${user.usuario}</p>
            <p><b>📧 Email:</b> ${user.email || 'No disponible'}</p>
            <p><b>🎓 Carrera:</b> ${user.carrera || 'No disponible'}</p>
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
        showMessage('🌐 Error al cargar perfil', 'error');
    }
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Sigue a un usuario en el sistema
 * @async
 * @param {string} usuario - Nombre de usuario a seguir
 * @param {string} nombre - Nombre completo del usuario para mostrar en mensajes
 * @throws {Error} Si hay problemas de conexión o ya se sigue al usuario
 * @returns {Promise<void>}
 * @description Envía una petición al backend para establecer una relación de seguimiento
 * entre el usuario actual y el usuario objetivo
 */
async function followUser(usuario, nombre) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${usuario}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ follower: currentUser.usuario })
        });
        
        if (response.ok) {
            showMessage(`✅ Ahora sigues a ${nombre}`, 'success');
            // Actualizar contadores
            if (typeof loadUserStats === 'function') loadUserStats();
            closeUserProfileModal();
        } else {
            const error = await response.text();
            showMessage(error || '❌ No se pudo seguir al usuario', 'error');
        }
    } catch (e) {
        showMessage('🌐 Error de conexión al seguir usuario', 'error');
    }
}

// ✅ FUNCIONES PARA MODAL DE PERFIL
function showProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) {
        console.error('Modal de perfil no encontrado');
        return;
    }

    loadCurrentUserData();
    modal.style.display = 'block';
}

function loadCurrentUserData() {
    if (!currentUser) return;

    document.getElementById('editUserName').value = currentUser.nombre || '';
    document.getElementById('editUserCareer').value = currentUser.carrera || '';
    document.getElementById('editUserEmail').value = currentUser.email || '';
    document.getElementById('profileImageUrl').value = currentUser.profileImageUrl || '';

    updateAvatarPreview(currentUser.profileImageUrl);
    loadUserStatistics();
}

function updateAvatarPreview(imageUrl) {
    const avatarContainer = document.getElementById('currentAvatar');
    
    if (imageUrl && isValidUrl(imageUrl)) {
        avatarContainer.innerHTML = `<img src="${imageUrl}" alt="Avatar" class="image-preview">`;
    } else {
        avatarContainer.innerHTML = `<span class="material-icons">account_circle</span>`;
    }
}

/**
 * Carga estadísticas detalladas del perfil del usuario
 * @async
 * @returns {Promise<void>}
 * @description Obtiene el número de playlists, seguidores, seguidos y fecha de registro
 * del usuario actual y actualiza la información en el modal de perfil
 */
async function loadUserStatistics() {
    if (!currentUser) return;

    try {
        const playlistsResponse = await fetch(`${API_BASE_URL}/playlists/user/${currentUser.usuario}`);
        if (playlistsResponse.ok) {
            const playlists = await playlistsResponse.json();
            document.getElementById('userPlaylistsCount').textContent = playlists.length;
        }

        try {
            const followersResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/followers`);
            if (followersResponse.ok) {
                const followers = await followersResponse.json();
                document.getElementById('userFollowersCount').textContent = followers.length;
            }
        } catch (error) {
            document.getElementById('userFollowersCount').textContent = '0';
        }

        try {
            const followingResponse = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}/following`);
            if (followingResponse.ok) {
                const following = await followingResponse.json();
                document.getElementById('userFollowingCount').textContent = following.length;
            }
        } catch (error) {
            document.getElementById('userFollowingCount').textContent = '0';
        }

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

function handleProfileImageChange() {
    const imageUrl = document.getElementById('profileImageUrl').value.trim();
    updateAvatarPreview(imageUrl);
}

function removeProfileImage() {
    document.getElementById('profileImageUrl').value = '';
    updateAvatarPreview('');
}

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con el resultado de la validación
 * @property {boolean} isValid - Indica si la contraseña es válida
 * @property {string[]} errors - Lista de requisitos no cumplidos
 * @description Verifica longitud mínima, mayúsculas, minúsculas, números y caracteres especiales
 */
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

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }

    field.classList.add('error');
    field.classList.remove('success');

    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }

    field.classList.remove('error');
    field.classList.add('success');
}

function clearFieldState(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }

    field.classList.remove('error', 'success');
}

/**
 * Maneja el envío del formulario de actualización de perfil
 * @async
 * @param {Event} event - Evento del formulario
 * @returns {Promise<void>}
 * @description Valida y envía los datos actualizados del perfil al servidor,
 * incluyendo nombre, carrera, email, imagen de perfil y contraseña opcional
 */
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

    ['editUserName', 'editUserCareer', 'editUserEmail', 'profileImageUrl', 'newPassword', 'confirmPassword'].forEach(clearFieldState);

    let hasErrors = false;

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
    
    if (formData.profileImageUrl && !isValidUrl(formData.profileImageUrl)) {
        showFieldError('profileImageUrl', 'URL de imagen no válida');
        hasErrors = true;
    }

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
        showMessage('❌ Por favor corrige los errores antes de continuar', 'error');
        return;
    }

    const avatarSection = document.querySelector('.profile-avatar-section');
    avatarSection.classList.add('loading');

    try {
        const updateData = {
            ...currentUser,
            ...formData
        };

        if (newPassword) {
            updateData.newPassword = newPassword;
        }

        const response = await fetch(`${API_BASE_URL}/users/${currentUser.usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadUserInfo();
            updateAvatarPreview(currentUser.profileImageUrl);
            showMessage('✅ Perfil actualizado exitosamente', 'success');
            setTimeout(() => {
                document.getElementById('profileModal').style.display = 'none';
            }, 1500);
        } else {
            const errorData = await response.text();
            showMessage(errorData || '❌ Error al actualizar perfil', 'error');
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showMessage('🌐 Error de conexión', 'error');
    } finally {
        avatarSection.classList.remove('loading');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.style.display = 'none';
    document.getElementById('profileForm').reset();
    ['editUserName', 'editUserCareer', 'editUserEmail', 'profileImageUrl', 'newPassword', 'confirmPassword'].forEach(clearFieldState);
}

// ✅ INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Iniciando DistriMusic Dashboard...');

    if (!checkAuthentication()) {
        return;
    }

    loadUserInfo();
    loadUserStats();
    loadMyPlaylists();

    // EVENT LISTENERS
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

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
        });
    }

    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.style.display = 'none';
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

    // Event listeners para modal de perfil
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
        btnProfile.addEventListener('click', showProfileModal);
    }

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

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }

    const profileImageUrl = document.getElementById('profileImageUrl');
    if (profileImageUrl) {
        profileImageUrl.addEventListener('input', handleProfileImageChange);
    }

    const removeProfileImageBtn = document.getElementById('removeProfileImage');
    if (removeProfileImageBtn) {
        removeProfileImageBtn.addEventListener('click', removeProfileImage);
    }

    console.log('✅ Dashboard inicializado correctamente');
});


// FUNCIONES GLOBALES
window.viewPlaylistDetails = viewPlaylistDetails;
window.selectSong = selectSong;
window.showSection = showSection;
window.showAddSongsModal = showAddSongsModal;
window.addSongToPlaylist = addSongToPlaylist;
window.removeSongFromPlaylist = removeSongFromPlaylist;
window.closeAddSongsModal = closeAddSongsModal;
window.viewUserProfile = viewUserProfile;