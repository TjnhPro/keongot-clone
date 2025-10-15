// Main JavaScript for Kẹo Ngọt Nhỏ Xinh

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Navigation links handling
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle internal page links
            if (href && !href.startsWith('#') && !href.startsWith('http')) {
                // Let the browser handle the navigation
                return;
            }
            
            // Handle anchor links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Help button functionality
    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            // This would typically open a help modal or redirect to help page
            alert('Tính năng hỗ trợ sẽ được phát triển trong phiên bản tiếp theo!');
        });
    }
    
    // Modal functionality
    const loginBtn = document.querySelector('.login-btn');
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeModal');
    const switchForm = document.getElementById('switchForm');
    const modalTitle = document.getElementById('modalTitle');
    const switchText = document.getElementById('switchText');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    let isLoginForm = true;

    // Open modal
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close modal when clicking overlay
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Switch between login and register forms
    if (switchForm) {
        switchForm.addEventListener('click', function(e) {
            e.preventDefault();
            isLoginForm = !isLoginForm;
            
            if (isLoginForm) {
                // Switch to login
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                modalTitle.textContent = 'Đăng nhập';
                switchText.textContent = 'Chưa có tài khoản?';
                switchForm.textContent = 'Đăng ký ngay';
            } else {
                // Switch to register
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                modalTitle.textContent = 'Đăng ký';
                switchText.textContent = 'Đã có tài khoản?';
                switchForm.textContent = 'Đăng nhập ngay';
            }
        });
    }

    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const username = formData.get('username');
            const password = formData.get('password');
            
            // Validation
            if (!username || !password) {
                auth.showToast('error', 'Thiếu thông tin!', 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
                return;
            }
            
            // Attempt login
            if (auth.login(username, password)) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                loginForm.reset();
                updateUserInterface();
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const name = formData.get('name');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const age = formData.get('age');
            const agree = formData.get('agree');
            
            // Validation
            if (!name || !password || !confirmPassword || !age) {
                auth.showToast('error', 'Thiếu thông tin!', 'Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            if (!agree) {
                auth.showToast('error', 'Chưa đồng ý điều khoản!', 'Vui lòng đọc và tích vào ô đồng ý điều khoản sử dụng.');
                return;
            }
            
            if (password !== confirmPassword) {
                auth.showToast('error', 'Mật khẩu không khớp!', 'Mật khẩu xác nhận không giống với mật khẩu đã nhập.');
                return;
            }
            
            if (age < 6 || age > 12) {
                auth.showToast('error', 'Tuổi không phù hợp!', 'Tuổi phải từ 6 đến 12 tuổi để sử dụng Kẹo Ngọt.');
                return;
            }
            
            // Attempt registration
            if (auth.register({ name, password, age: parseInt(age) })) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                registerForm.reset();
                // Switch to login form after successful registration
                isLoginForm = true;
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                modalTitle.textContent = 'Đăng nhập';
                switchText.textContent = 'Chưa có tài khoản?';
                switchForm.textContent = 'Đăng ký ngay';
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    
    // Character interaction
    const mainCharacter = document.querySelector('.main-character');
    if (mainCharacter) {
        mainCharacter.addEventListener('click', function() {
            // Add a fun interaction when clicking on the character
            this.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
            
            // Change speech bubble text
            const speechBubble = document.querySelector('.character-speech p');
            if (speechBubble) {
                const messages = [
                    'Xin chào! Mình là Kẹo Ngọt!',
                    'Bạn có muốn chia sẻ gì không?',
                    'Hãy cùng vui chơi nhé!',
                    'Mình luôn ở đây để lắng nghe bạn!',
                    'Bạn có khỏe không?'
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                speechBubble.textContent = randomMessage;
            }
        });
    }
    
    // Feature cards hover effect
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add some interactive sparkles
    createSparkles();
});

// Function to create floating sparkles
function createSparkles() {
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'sparkle-container';
    sparkleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    document.body.appendChild(sparkleContainer);
    
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.innerHTML = '✨';
        sparkle.style.cssText = `
            position: absolute;
            font-size: 20px;
            color: #FFD93D;
            animation: sparkleFloat 3s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: 0.7;
        `;
        
        sparkleContainer.appendChild(sparkle);
        
        setTimeout(() => {
            sparkle.remove();
        }, 3000);
    }
    
    // Create sparkles periodically
    setInterval(createSparkle, 2000);
    
    // Add CSS for sparkle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparkleFloat {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
            }
            50% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Function to handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause animations when page is not visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when page becomes visible
        document.body.style.animationPlayState = 'running';
    }
});

// Add some fun sound effects (optional)
function playClickSound() {
    // This would play a gentle click sound
    // For now, we'll just add a visual feedback
    const clickEffect = document.createElement('div');
    clickEffect.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FF6B9D, transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: clickRipple 0.6s ease-out;
    `;
    
    document.body.appendChild(clickEffect);
    
    setTimeout(() => {
        clickEffect.remove();
    }, 600);
}

// Add click ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes clickRipple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Add click effect to interactive elements
document.addEventListener('click', function(e) {
    if (e.target.matches('button, .feature-card, .nav-link')) {
        playClickSound();
    }
});

// Typing effect for welcome text
function initTypingEffect() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;
    
    const text = '';
    let index = 0;
    
    function typeWriter() {
        if (index < text.length) {
            typingElement.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, 50); // Tốc độ đánh máy: 50ms/ký tự
        } else {
            // Khi đánh xong, giữ cursor nhấp nháy
            typingElement.style.borderRight = '3px solid white';
        }
    }
    
    // Bắt đầu sau 500ms để có thời gian load trang
    setTimeout(typeWriter, 500);
}

// Update user interface based on login status
function updateUserInterface() {
    const loginBtn = document.querySelector('.login-btn');
    const currentUser = auth.getCurrentUser();
    
    if (currentUser) {
        // User is logged in - show logout button
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                ${currentUser.name}
                <i class="fas fa-sign-out-alt"></i>
            `;
            loginBtn.classList.add('logged-in');
            loginBtn.title = 'Đăng xuất';
            
            // Remove any existing event listeners
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.querySelector('.login-btn');
            
            // Add logout functionality
            newLoginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                auth.logout();
                updateUserInterface();
            });
        }
    } else {
        // User is not logged in - show login button
        if (loginBtn) {
            loginBtn.innerHTML = 'Đăng nhập';
            loginBtn.classList.remove('logged-in');
            loginBtn.title = 'Đăng nhập';
            
            // Remove any existing event listeners
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.querySelector('.login-btn');
            
            // Restore original login functionality
            newLoginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const authModal = document.getElementById('authModal');
                if (authModal) {
                    authModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    }
}

// Initialize user interface on page load
function initUserInterface() {
    updateUserInterface();
    
    // Check if user is already logged in
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        auth.showToast('info', 'Chào mừng trở lại!', `Xin chào ${user.name}! Bạn đã đăng nhập rồi.`);
    }

}

// Gọi function khi trang load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initTypingEffect();
        initUserInterface();
    });
} else {
    initTypingEffect();
    initUserInterface();
}
