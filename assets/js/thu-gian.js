// Thu Gian Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initNotifyForm();
});

// Notify form functionality
function initNotifyForm() {
    const notifyBtn = document.getElementById('notifyBtn');
    const notifyEmail = document.getElementById('notifyEmail');
    
    if (notifyBtn && notifyEmail) {
        notifyBtn.addEventListener('click', function() {
            const email = notifyEmail.value.trim();
            
            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                showNotification('Vui lòng nhập email của bạn!', 'error');
                return;
            }
            
            if (!emailRegex.test(email)) {
                showNotification('Email không hợp lệ! Vui lòng kiểm tra lại.', 'error');
                return;
            }
            
            // Save to localStorage (in real app, this would be sent to backend)
            let notifyList = JSON.parse(localStorage.getItem('notifyListThuGian') || '[]');
            
            if (notifyList.includes(email)) {
                showNotification('Email này đã được đăng ký!', 'info');
                return;
            }
            
            notifyList.push(email);
            localStorage.setItem('notifyListThuGian', JSON.stringify(notifyList));
            
            // Clear input
            notifyEmail.value = '';
            
            // Show success message
            showNotification('Cảm ơn bạn! Chúng tôi sẽ thông báo khi tính năng sẵn sàng! 🎉', 'success');
        });
        
        // Enter key support
        notifyEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                notifyBtn.click();
            }
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'info-circle';
    let bgColor = '#2196F3';
    
    if (type === 'success') {
        icon = 'check-circle';
        bgColor = '#4CAF50';
    } else if (type === 'error') {
        icon = 'exclamation-circle';
        bgColor = '#f44336';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Add animation to preview cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                entry.target.style.transition = 'all 0.6s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, 100);
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all preview cards
document.querySelectorAll('.preview-card').forEach(card => {
    observer.observe(card);
});
