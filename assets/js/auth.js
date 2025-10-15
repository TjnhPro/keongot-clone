// Authentication System with localStorage
class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.initToastContainer();
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('keongot_users');
        return users ? JSON.parse(users) : [];
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('keongot_users', JSON.stringify(this.users));
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const user = localStorage.getItem('keongot_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Save current user to localStorage
    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem('keongot_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('keongot_current_user');
        }
    }

    // Initialize toast container
    initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    // Show toast notification
    showToast(type, title, message, duration = 4000) {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '🎉',
            error: '😢',
            warning: '🤔',
            info: '💡'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Register new user
    register(userData) {
        const { name, password, age } = userData;

        // Check if username already exists
        const existingUser = this.users.find(user => user.name.toLowerCase() === name.toLowerCase());
        if (existingUser) {
            this.showToast('error', 'Đăng ký thất bại!', 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
            return false;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            password, // In real app, this should be hashed
            age,
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar(name)
        };

        this.users.push(newUser);
        this.saveUsers();

        this.showToast('success', 'Đăng ký thành công! 🎉', `Chào mừng ${name} đến với Kẹo Ngọt! Bạn có thể đăng nhập ngay bây giờ.`);
        return true;
    }

    // Login user
    login(username, password) {
        const user = this.users.find(u => u.name.toLowerCase() === username.toLowerCase() && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.saveCurrentUser(user);
            this.showToast('success', 'Đăng nhập thành công! 🎉', `Chào mừng trở lại, ${user.name}!`);
            return true;
        } else {
            // Check if username exists
            const usernameExists = this.users.find(u => u.name.toLowerCase() === username.toLowerCase());
            if (usernameExists) {
                this.showToast('error', 'Sai mật khẩu!', 'Mật khẩu không đúng. Vui lòng kiểm tra lại.');
            } else {
                this.showToast('warning', 'Tài khoản chưa tồn tại!', 'Tên đăng nhập này chưa được đăng ký. Hãy đăng ký tài khoản mới nhé!');
            }
            return false;
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.saveCurrentUser(null);
        this.showToast('info', 'Đã đăng xuất!', 'Hẹn gặp lại bạn lần sau nhé! 👋');
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Generate simple avatar based on name
    generateAvatar(name) {
        const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const color = colors[name.length % colors.length];
        const initial = name.charAt(0).toUpperCase();
        
        return {
            color,
            initial,
            emoji: this.getRandomEmoji()
        };
    }

    // Get random emoji for avatar
    getRandomEmoji() {
        const emojis = ['😊', '😄', '😍', '🥰', '😘', '🤗', '😇', '🤩', '😋', '😎'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    // Update user profile
    updateProfile(updates) {
        if (!this.currentUser) return false;

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.currentUser = this.users[userIndex];
            this.saveUsers();
            this.saveCurrentUser(this.currentUser);
            this.showToast('success', 'Cập nhật thành công!', 'Thông tin của bạn đã được lưu.');
            return true;
        }
        return false;
    }

    // Get user statistics
    getUserStats() {
        if (!this.currentUser) return null;

        return {
            totalUsers: this.users.length,
            userRank: this.users.findIndex(u => u.id === this.currentUser.id) + 1,
            daysSinceJoined: Math.floor((new Date() - new Date(this.currentUser.createdAt)) / (1000 * 60 * 60 * 24))
        };
    }

}

// Initialize auth system
const auth = new AuthSystem();

// Export for use in other files
window.auth = auth;
