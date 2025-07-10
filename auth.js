// DistriMusic - JavaScript de Autenticación (Solo Visual)

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

// Detectar si viene desde un enlace específico
document.addEventListener('DOMContentLoaded', function() {
    // Verificar parámetros URL para determinar qué formulario mostrar
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'register') {
        toggleForm(); // Mostrar formulario de registro
    }
    
    // Efectos visuales para los inputs
    const inputs = document.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        // Efecto de focus
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        // Efecto de blur
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            
            // Validación visual básica (sin funcionalidad)
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });
        
        // Efecto de typing
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });
    });
    
    // Prevenir envío de formularios (no hacer nada por ahora)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Solo efecto visual del botón
            const button = this.querySelector('.btn-primary');
            button.classList.add('loading');
            
            // Remover estado loading después de 2 segundos
            setTimeout(() => {
                button.classList.remove('loading');
            }, 2000);
        });
    });
    
    // Animación de entrada
    const authCard = document.querySelector('.auth-card');
    authCard.style.opacity = '0';
    authCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        authCard.style.transition = 'all 0.6s ease';
        authCard.style.opacity = '1';
        authCard.style.transform = 'translateY(0)';
    }, 100);
});

// ✅ NUEVO: Función para validar contraseña con todos los requisitos
function validatePassword(password) {
    const passwordInput = document.getElementById('registerPassword');
    const requirementsContainer = document.getElementById('passwordRequirements');
    
    // Mostrar/ocultar requisitos cuando se hace focus
    if (password.length > 0) {
        requirementsContainer.classList.add('show');
    } else {
        requirementsContainer.classList.remove('show');
    }
    
    // Definir requisitos
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };
    
    // Actualizar cada requisito visualmente
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (requirements[req]) {
            element.classList.remove('invalid');
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
            element.classList.add('invalid');
        }
    });
    
    // Verificar si todos los requisitos se cumplen
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

// ✅ ACTUALIZADO: Función para validar confirmación de contraseña
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    // Solo validar si hay contenido en ambos campos
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

// Event listeners para validación visual en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const requirementsContainer = document.getElementById('passwordRequirements');
    
    if (registerPassword) {
        // Mostrar requisitos al hacer focus
        registerPassword.addEventListener('focus', function() {
            if (this.value.length > 0) {
                requirementsContainer.classList.add('show');
            }
        });
        
        // Ocultar requisitos al hacer blur si está vacío
        registerPassword.addEventListener('blur', function() {
            if (this.value.length === 0) {
                requirementsContainer.classList.remove('show');
            }
        });
        
        // Validar en tiempo real mientras escribe
        registerPassword.addEventListener('input', function() {
            validatePassword(this.value);
            if (confirmPassword.value) {
                validatePasswordMatch();
            }
        });
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
});

// Función para manejar los combos de carreras y ciudades
document.addEventListener('DOMContentLoaded', function() {
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
        // Ciudad ya viene preseleccionada, agregar clase success
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
});

// Efectos adicionales para mejorar UX
document.addEventListener('DOMContentLoaded', function() {
    // Efecto de ripple en botones
    const buttons = document.querySelectorAll('.btn-primary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Añadir animación CSS para ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
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