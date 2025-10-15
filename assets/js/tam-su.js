// Tam Su Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initStoryWriter();
    initMyStories();
});

// Story writer functionality
function initStoryWriter() {
    const storyText = document.getElementById('storyText');
    const wordCount = document.getElementById('wordCount');
    const saveBtn = document.getElementById('saveStory');
    const clearBtn = document.getElementById('clearStory');
    const templateBtns = document.querySelectorAll('.template-btn');
    const emotionSelect = document.getElementById('emotionSelect');
    
    // Template content
    const templates = {
        free: '',
        happy: 'Hôm nay tôi vui vì... ',
        sad: 'Hôm nay tôi buồn vì... ',
        angry: 'Tôi tức giận khi... ',
        scared: 'Tôi sợ hãi khi... ',
        grateful: 'Tôi biết ơn vì... '
    };
    
    // Update word count
    function updateWordCount() {
        const text = storyText.value;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        wordCount.textContent = words.length;
    }
    
    // Template selection with fake functionality
    templateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            templateBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Save selected template to localStorage
            const template = this.dataset.template;
            localStorage.setItem('selectedTemplate', template);
            
            // Set template content
            if (template !== 'free') {
                storyText.value = templates[template];
                updateWordCount();
                storyText.focus();
            } else {
                storyText.value = '';
                updateWordCount();
            }
            
            // Show fake success message
            showFakeMessage('Đã chọn chủ đề: ' + this.textContent);
        });
    });
    
    // Emotion selection with fake functionality
    if (emotionSelect) {
        emotionSelect.addEventListener('change', function() {
            const selectedEmotion = this.value;
            const emotionText = this.options[this.selectedIndex].text;
            
            // Save emotion to localStorage
            localStorage.setItem('selectedEmotion', selectedEmotion);
            localStorage.setItem('selectedEmotionText', emotionText);
            
            // Show fake success message
            showFakeMessage('Đã chọn cảm xúc: ' + emotionText);
        });
    }
    
    // Word count update
    storyText.addEventListener('input', updateWordCount);
    
    // Save story with fake functionality
    saveBtn.addEventListener('click', function() {
        const text = storyText.value.trim();
        const emotion = emotionSelect.value;
        const template = localStorage.getItem('selectedTemplate') || 'free';
        const editingId = localStorage.getItem('editingStoryId');
        
        if (text.length === 0) {
            showFakeMessage('Vui lòng viết câu chuyện trước khi lưu!', 'error');
            return;
        }
        
        // Get stories from localStorage
        const stories = JSON.parse(localStorage.getItem('stories') || '[]');
        
        if (editingId) {
            // Update existing story
            const storyIndex = stories.findIndex(s => s.id == editingId);
            if (storyIndex !== -1) {
                stories[storyIndex] = {
                    ...stories[storyIndex],
                    text: text,
                    emotion: emotion,
                    template: template,
                    wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length,
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString('vi-VN')
                };
                showFakeMessage('Đã cập nhật câu chuyện thành công! 🎉');
            }
            // Clear editing mode
            localStorage.removeItem('editingStoryId');
        } else {
            // Create new story
            const story = {
                id: Date.now(),
                text: text,
                emotion: emotion,
                template: template,
                wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('vi-VN')
            };
            stories.push(story);
            showFakeMessage('Đã lưu câu chuyện thành công! 🎉');
        }
        
        // Save to localStorage
        localStorage.setItem('stories', JSON.stringify(stories));
        
        // Clear form
        storyText.value = '';
        updateWordCount();
        emotionSelect.value = '😊';
        
        // Clear template selection
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => btn.classList.remove('active'));
        templateBtns[0].classList.add('active'); // Set "Tự do viết" as active
        
        // Refresh stories display
        if (typeof loadStories === 'function') {
            loadStories();
        }
    });
    
    // Clear story
    clearBtn.addEventListener('click', function() {
        storyText.value = '';
        updateWordCount();
        emotionSelect.value = '😊';
        
        // Clear editing mode
        localStorage.removeItem('editingStoryId');
        
        // Clear template selection
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => btn.classList.remove('active'));
        templateBtns[0].classList.add('active'); // Set "Tự do viết" as active
        
        showFakeMessage('Đã xóa nội dung!');
    });
}

// Fake message function
function showFakeMessage(message, type = 'success') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `fake-message ${type}`;
    messageEl.textContent = message;
    
    // Style the message
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4757' : '#2ed573'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation CSS if not exists
    if (!document.querySelector('#fake-message-styles')) {
        const style = document.createElement('style');
        style.id = 'fake-message-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

// My stories functionality
function initMyStories() {
    displayStories();
}

function displayStories() {
    const storiesGrid = document.getElementById('storiesGrid');
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    
    if (stories.length === 0) {
        storiesGrid.innerHTML = `
            <div class="no-stories">
                <i class="fas fa-book-open"></i>
                <p>Bạn chưa có câu chuyện nào. Hãy viết câu chuyện đầu tiên nhé!</p>
            </div>
        `;
        return;
    }
    
    storiesGrid.innerHTML = stories.map(story => `
        <div class="story-card" data-id="${story.id}">
            <div class="story-header">
                <span class="story-emotion">${story.emotion}</span>
                <span class="story-date">${story.date}</span>
                <span class="story-template">${getTemplateName(story.template)}</span>
            </div>
            <div class="story-preview">${story.text.substring(0, 100)}${story.text.length > 100 ? '...' : ''}</div>
            <div class="story-stats">
                <span class="word-count">${story.wordCount} từ</span>
            </div>
            <div class="story-actions">
                <button class="story-action-btn" onclick="viewStory(${story.id})" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="story-action-btn" onclick="editStory(${story.id})" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="story-action-btn" onclick="deleteStory(${story.id})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Helper function to get template name
function getTemplateName(template) {
    const templateNames = {
        'free': 'Tự do viết',
        'happy': 'Hôm nay tôi vui vì...',
        'sad': 'Hôm nay tôi buồn vì...',
        'angry': 'Tôi tức giận khi...',
        'scared': 'Tôi sợ hãi khi...',
        'grateful': 'Tôi biết ơn vì...'
    };
    return templateNames[template] || 'Tự do viết';
}

// Story actions
function viewStory(id) {
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const story = stories.find(s => s.id === id);
    
    if (story) {
        alert(`Câu chuyện của bạn:\n\n${story.text}`);
    }
}

function editStory(id) {
    const stories = JSON.parse(localStorage.getItem('stories') || '[]');
    const story = stories.find(s => s.id === id);
    
    if (story) {
        // Store the editing story ID
        localStorage.setItem('editingStoryId', id);
        
        // Scroll to story writer
        document.querySelector('.story-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        // Fill the form
        document.getElementById('storyText').value = story.text;
        document.getElementById('emotionSelect').value = story.emotion;
        document.getElementById('wordCount').textContent = story.text.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Set template button active
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.template === story.template) {
                btn.classList.add('active');
            }
        });
        
        // Focus on textarea
        document.getElementById('storyText').focus();
        
        showFakeMessage('Đã tải câu chuyện để chỉnh sửa!');
    }
}

function deleteStory(id) {
    if (confirm('Bạn có chắc muốn xóa câu chuyện này không?')) {
        let stories = JSON.parse(localStorage.getItem('stories') || '[]');
        stories = stories.filter(s => s.id !== id);
        localStorage.setItem('stories', JSON.stringify(stories));
        displayStories();
        showNotification('Đã xóa câu chuyện!', 'success');
    }
}

// Load stories function for refresh
function loadStories() {
    displayStories();
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
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
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
    }, 3000);
}


