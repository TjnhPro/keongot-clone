// Authentication Sync - Đồng bộ trạng thái đăng nhập giữa các trang
class AuthSync {
    constructor() {
        this.init();
    }

    init() {
        // Kiểm tra nếu auth system đã được load
        if (typeof auth !== 'undefined') {
            this.setupAuthSync();
        } else {
            // Đợi auth system load xong
            setTimeout(() => this.init(), 100);
        }
    }

    setupAuthSync() {
        // Lắng nghe thay đổi trong localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'keongot_current_user') {
                this.updateAllPages();
            }
        });

        // Cập nhật UI khi trang load
        this.updateAllPages();

        // Thêm event listener cho logout từ các trang khác
        this.setupLogoutListener();
        
        // Cập nhật định kỳ để đảm bảo đồng bộ
        setInterval(() => {
            this.updateAllPages();
        }, 1000);
    }

    updateAllPages() {
        const currentUser = auth.getCurrentUser();
        this.updateNavigation(currentUser);
        this.updatePageContent(currentUser);
    }

    updateNavigation(currentUser) {
        const loginBtn = document.querySelector('.login-btn');
        if (!loginBtn) return;

        if (currentUser) {
            // User đã đăng nhập
            loginBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                ${currentUser.name}
                <i class="fas fa-sign-out-alt"></i>
            `;
            loginBtn.classList.add('logged-in');
            loginBtn.title = 'Đăng xuất';
            
            // Xóa event listener cũ và thêm mới
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.querySelector('.login-btn');
            
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
                this.updateAllPages();
            });
        } else {
            // User chưa đăng nhập
            loginBtn.innerHTML = 'Đăng nhập';
            loginBtn.classList.remove('logged-in');
            loginBtn.title = 'Đăng nhập';
            
            // Xóa event listener cũ và thêm mới
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            const newLoginBtn = document.querySelector('.login-btn');
            
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openLoginModal();
            });
        }
    }

    updatePageContent(currentUser) {
        // Cập nhật nội dung trang dựa trên trạng thái đăng nhập
        const protectedElements = document.querySelectorAll('[data-requires-login]');
        const guestElements = document.querySelectorAll('[data-guest-only]');
        
        protectedElements.forEach(element => {
            if (currentUser) {
                element.style.display = '';
                element.classList.remove('hidden');
            } else {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        });

        guestElements.forEach(element => {
            if (currentUser) {
                element.style.display = 'none';
                element.classList.add('hidden');
            } else {
                element.style.display = '';
                element.classList.remove('hidden');
            }
        });

        // Cập nhật welcome message nếu có
        const welcomeElement = document.querySelector('.welcome-message');
        if (welcomeElement && currentUser) {
            welcomeElement.textContent = `Xin chào ${currentUser.name}! 👋`;
        }
    }

    openLoginModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    setupLogoutListener() {
        // Lắng nghe logout từ auth system
        const originalLogout = auth.logout;
        auth.logout = () => {
            originalLogout.call(auth);
            this.updateAllPages();
        };
    }

    // Method để các trang khác có thể gọi để cập nhật
    refresh() {
        this.updateAllPages();
    }
}

// Khởi tạo AuthSync khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.authSync = new AuthSync();
});

// Export cho các trang khác sử dụng
window.AuthSync = AuthSync;
