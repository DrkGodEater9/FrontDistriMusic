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

// Función para validar contraseña visualmente (solo efectos)
function validatePassword(password) {
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmPassword');
    
    // Solo efectos visuales, sin validación real
    if (password.length >= 8) {
        passwordInput.parentElement.classList.add('success');
    } else {
        passwordInput.parentElement.classList.remove('success');
    }
}

// Función para validar confirmación de contraseña visualmente
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    // Solo efectos visuales
    if (password === confirmPassword && confirmPassword !== '') {
        confirmInput.parentElement.classList.add('success');
    } else {
        confirmInput.parentElement.classList.remove('success');
    }
}

// Event listeners para validación visual en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (registerPassword) {
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

// Función para manejar el combo de carreras
document.addEventListener('DOMContentLoaded', function() {
    const careerSelect = document.getElementById('career');
    
    if (careerSelect) {
        careerSelect.addEventListener('change', function() {
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