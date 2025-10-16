// Authentication System with localStorage
class AuthSystem {
    constructor() {
        this.apiBase = 'https://n8n.brandipreports.com/webhook/keongot';
         this.user_progress_key = 'keongot_user_progress';

        this.currentUser = this.loadCurrentUser();
        this.initToastContainer();
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
    async register(userData) {
        const { name, password, age } = userData;

        // Create new user
        const newUser = {
            name,
            password, // In real app, this should be hashed
            age,
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar(name)
        };

        const registerResponse = await fetch(`${this.apiBase}/auth/register`,{
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser)
        });

        if(!registerResponse.ok){
            this.showToast('error', 'Đăng ký thất bại!', 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
            return false;
        }

        const registerResponseJson = await registerResponse.json();
        if(!registerResponseJson.success){
            this.showToast('error', 'Đăng ký thất bại!', 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
            return false;
        }

        this.currentUser = loginResponseJson.data;
        saveCurrentUser(registerResponseJson.data);

        this.showToast('success', 'Đăng ký thành công! 🎉', `Chào mừng ${name} đến với Kẹo Ngọt! Bạn có thể đăng nhập ngay bây giờ.`);
        return true;
    }

    // Login user
    async login(username, password) {

        const loginResponse = await fetch(`${this.apiBase}/auth/login`,{
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: username,
                password: password
            })
        });

        if(!loginResponse.ok){
            this.showToast('error', 'Đăng nhập thất bại!', 'Kiểm tra kết nối');
            return false;
        }

        const loginResponseJson = await loginResponse.json();
        if(!loginResponseJson.success){
            this.showToast('error', 'Đăng nhập thất bại!', 'Vui lòng kiểm tra lại tài khoản và mật khẩu');
            return false;
        }

        this.currentUser = loginResponseJson.data;
        this.saveCurrentUser(loginResponseJson.data);

        //load process
        await this.loadUserProcess();

        this.showToast('success', 'Đăng nhập thành công! 🎉', `Chào mừng trở lại!`);
        return true;
    }

    // load current from storage
    loadCurrentUserProgress(){
        const userProcess = localStorage.getItem(this.user_progress_key);
        return userProcess ? JSON.parse(userProcess) : null;
    }

    // save current process to storage
    saveUserProgress(userProgress){
        if (userProgress) {
            localStorage.setItem(this.user_progress_key, JSON.stringify(userProgress));
        } else {
            localStorage.removeItem(this.user_progress_key);
        }
    }

    // load current process from api
    async loadUserProcess(){
        if (this.currentUser === null) {
            console.log("upload userProgress -> isLoggedIn = false");
            return false;
        }

        const Response = await fetch(`${this.apiBase}/userProgress`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.currentUser.token}`
            }
        });

        if (!Response.ok) {
            console.log("upload userProgress -> Server Response Error");
            return false;
        }

        const ResponseJson = await Response.json();
        if (!ResponseJson.success) {
             console.log("upload userProgress -> Server Response Empty");
            return false;
        }

        this.saveUserProgress(ResponseJson.data);
        return true;
    }

    // update current process from api
    async updateuserProgress(UserProgress) {
        this.saveUserProgress(UserProgress)
        
        if (this.currentUser === null) {
            console.log("upload userProgress -> isLoggedIn = false");
            return false;
        }

        const Response = await fetch(`${this.apiBase}/userProgress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.currentUser.token}`
            },
            body: JSON.stringify(UserProgress)
        });

        if (!Response.ok) {
            console.log("upload userProgress -> Server Response Error");
            return false;
        }

        const ResponseJson = await Response.json();
        if (!ResponseJson.success) {
             console.log("upload userProgress -> Server Response Empty");
            return false;
        }

        return true;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        this.saveCurrentUser(null);
        this.saveUserProgress(null);
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

}

// Initialize auth system
const auth = new AuthSystem();

// Export for use in other files
window.auth = auth;
