// DistriMusic - JavaScript de Autenticación FUNCIONAL con Backend

// URL base de la API
const API_BASE_URL = 'http://localhost:8090/api';

// Función para alternar entre login y registro
function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
        // Mostrar login, ocultar registro
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.title = 'DistriMusic - Iniciar Sesión';
    } else {
        // Mostrar registro, ocultar login
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        document.title = 'DistriMusic - Registrarse';
    }
}

// ✅ FUNCIÓN PARA LOGIN CON FETCH
async function handleLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('loginUser').value.trim();
    const contraseña = document.getElementById('loginPassword').value;
    const button = event.target.querySelector('.btn-primary');
    
    // Validación básica
    if (!usuario || !contraseña) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    // Mostrar estado de carga
    button.classList.add('loading');
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: usuario,
                contraseña: contraseña
            })
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Guardar datos del usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
            
            showMessage('¡Inicio de sesión exitoso!', 'success');
            
            // Redirigir al dashboard después de 1 segundo
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            const errorData = await response.text();
            let errorMessage = 'Error al iniciar sesión';
            
            if (response.status === 404) {
                errorMessage = 'Usuario no encontrado';
            } else if (response.status === 400) {
                errorMessage = 'Credenciales incorrectas';
            } else if (errorData) {
                errorMessage = errorData;
            }
            
            showMessage(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showMessage('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
    } finally {
        // Remover estado de carga
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ✅ FUNCIÓN PARA REGISTRO CON FETCH
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = {
        usuario: document.getElementById('registerUser').value.trim(),
        nombre: document.getElementById('registerName').value.trim(),
        contraseña: document.getElementById('registerPassword').value,
        codigoEstudiantil: document.getElementById('studentCode').value.trim(),
        carrera: document.getElementById('career').value,
        ubicacion: document.getElementById('city').value,
        email: document.getElementById('email').value.trim()
    };
    
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = event.target.querySelector('.btn-primary');
    
    // Validaciones
    if (!validateRegistrationForm(formData, confirmPassword)) {
        return;
    }
    
    // Mostrar estado de carga
    button.classList.add('loading');
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            showMessage('¡Registro exitoso! Se ha enviado un email de confirmación.', 'success');
            
            // Limpiar formulario
            document.getElementById('registerForm').querySelector('form').reset();
            
            // Cambiar a formulario de login después de 2 segundos
            setTimeout(() => {
                toggleForm();
                showMessage('Ahora puedes iniciar sesión con tu usuario y contraseña', 'info');
            }, 2000);
            
        } else {
            const errorData = await response.text();
            let errorMessage = 'Error al registrar usuario';
            
            if (response.status === 400) {
                if (errorData.includes('usuario ya existe')) {
                    errorMessage = 'El nombre de usuario ya está en uso';
                } else if (errorData.includes('email ya está registrado')) {
                    errorMessage = 'El email ya está registrado';
                } else {
                    errorMessage = errorData;
                }
            }
            
            showMessage(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showMessage('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
    } finally {
        // Remover estado de carga
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ✅ VALIDACIÓN DEL FORMULARIO DE REGISTRO
function validateRegistrationForm(formData, confirmPassword) {
    // Verificar campos obligatorios
    for (const [key, value] of Object.entries(formData)) {
        if (!value || value === '') {
            showMessage(`El campo ${getFieldDisplayName(key)} es obligatorio`, 'error');
            return false;
        }
    }
    
    // Validar contraseña
    if (!validatePassword(formData.contraseña)) {
        showMessage('La contraseña no cumple con los requisitos mínimos', 'error');
        return false;
    }
    
    // Validar confirmación de contraseña
    if (formData.contraseña !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return false;
    }
    
    // Validar email
    if (!validateEmail(formData.email)) {
        showMessage('El email no tiene un formato válido', 'error');
        return false;
    }
    
    return true;
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES
function showMessage(message, type = 'info') {
    // Remover mensaje anterior si existe
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos del mensaje
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
    
    // Colores según tipo
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
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 5000);
}

// ✅ VALIDACIÓN DE PASSWORD CON REQUISITOS
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    return Object.values(requirements).every(req => req);
}

// ✅ VALIDACIÓN DE EMAIL
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ✅ OBTENER NOMBRE AMIGABLE DEL CAMPO
function getFieldDisplayName(fieldName) {
    const fieldNames = {
        usuario: 'Usuario',
        nombre: 'Nombre',
        contraseña: 'Contraseña',
        codigoEstudiantil: 'Código estudiantil',
        carrera: 'Carrera',
        ubicacion: 'Ciudad',
        email: 'Email'
    };
    return fieldNames[fieldName] || fieldName;
}

// ✅ ACTUALIZAR VALIDACIÓN VISUAL DE CONTRASEÑA EN TIEMPO REAL
function updatePasswordValidation(password) {
    const passwordInput = document.getElementById('registerPassword');
    const requirementsContainer = document.getElementById('passwordRequirements');
    
    // Mostrar/ocultar requisitos
    if (password.length > 0) {
        requirementsContainer.classList.add('show');
    } else {
        requirementsContainer.classList.remove('show');
    }
    
    // Validar cada requisito
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    // Actualizar UI de cada requisito
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
            if (requirements[req]) {
                element.classList.remove('invalid');
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
                element.classList.add('invalid');
            }
        }
    });
    
    // Actualizar estado del input
    const allValid = Object.values(requirements).every(req => req);
    if (allValid) {
        passwordInput.parentElement.classList.remove('error');
        passwordInput.parentElement.classList.add('success');
    } else if (password.length > 0) {
        passwordInput.parentElement.classList.remove('success');
        passwordInput.parentElement.classList.add('error');
    } else {
        passwordInput.parentElement.classList.remove('success', 'error');
    }
    
    return allValid;
}

// ✅ VALIDAR CONFIRMACIÓN DE CONTRASEÑA
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (password.length > 0 && confirmPassword.length > 0) {
        if (password === confirmPassword) {
            confirmInput.parentElement.classList.remove('error');
            confirmInput.parentElement.classList.add('success');
            return true;
        } else {
            confirmInput.parentElement.classList.remove('success');
            confirmInput.parentElement.classList.add('error');
            return false;
        }
    } else {
        confirmInput.parentElement.classList.remove('success', 'error');
        return false;
    }
}

// ✅ VERIFICAR SI YA ESTÁ LOGUEADO
function checkIfLoggedIn() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn === 'true' && currentUser) {
        // Ya está logueado, redirigir al dashboard
        window.location.href = 'dashboard.html';
    }
}

// ✅ INICIALIZACIÓN CUANDO CARGA LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está logueado
    checkIfLoggedIn();
    
    // Detectar parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'register') {
        toggleForm();
    }
    
    // ✅ AGREGAR EVENT LISTENERS A LOS FORMULARIOS
    const loginForm = document.querySelector('#loginForm form');
    const registerForm = document.querySelector('#registerForm form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // ✅ VALIDACIÓN EN TIEMPO REAL DE CONTRASEÑA
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            updatePasswordValidation(this.value);
            if (confirmPassword.value) {
                validatePasswordMatch();
            }
        });
        
        registerPassword.addEventListener('focus', function() {
            if (this.value.length > 0) {
                document.getElementById('passwordRequirements').classList.add('show');
            }
        });
        
        registerPassword.addEventListener('blur', function() {
            if (this.value.length === 0) {
                document.getElementById('passwordRequirements').classList.remove('show');
            }
        });
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    // ✅ EFECTOS VISUALES PARA INPUTS
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });
        
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });
    });
    
    // ✅ VALIDACIÓN VISUAL PARA SELECTS
    const careerSelect = document.getElementById('career');
    const citySelect = document.getElementById('city');
    
    if (careerSelect) {
        careerSelect.addEventListener('change', function() {
            if (this.value !== '') {
                this.parentElement.classList.add('success');
            } else {
                this.parentElement.classList.remove('success');
            }
        });
    }
    
    if (citySelect) {
        // Ciudad ya viene preseleccionada
        if (citySelect.value !== '') {
            citySelect.parentElement.classList.add('success');
        }
        
        citySelect.addEventListener('change', function() {
            if (this.value !== '') {
                this.parentElement.classList.add('success');
            } else {
                this.parentElement.classList.remove('success');
            }
        });
    }
    
    // ✅ ANIMACIÓN DE ENTRADA
    const authCard = document.querySelector('.auth-card');
    authCard.style.opacity = '0';
    authCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        authCard.style.transition = 'all 0.6s ease';
        authCard.style.opacity = '1';
        authCard.style.transform = 'translateY(0)';
    }, 100);
    
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
        
        .btn-primary.loading {
            opacity: 0.7;
            cursor: not-allowed;
            position: relative;
        }
        
        .btn-primary.loading::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            margin: auto;
            border: 2px solid transparent;
            border-top-color: var(--spotify-white);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .input-group.focused label {
            color: var(--spotify-purple);
        }
        
        .input-group.filled label {
            color: var(--spotify-purple);
        }
    `;
    document.head.appendChild(style);
});

// ✅ FUNCIÓN PARA DEBUGGING (puedes remover en producción)
function debugAPI() {
    console.log('🔍 Debugging DistriMusic API');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Verificando conexión...');
    
    fetch(`${API_BASE_URL}/users`)
        .then(response => {
            console.log('✅ Conexión exitosa con el backend');
            console.log('Status:', response.status);
        })
        .catch(error => {
            console.log('❌ Error de conexión:', error);
            console.log('Verifica que Spring Boot esté ejecutándose en puerto 8090');
        });
}

// Ejecutar debug al cargar (comentar en producción)
// debugAPI();