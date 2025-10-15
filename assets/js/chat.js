// Chat functionality for Tam Su page
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const quickButtons = document.querySelectorAll('.quick-btn');

    // Bot responses based on keywords
    const botResponses = {
        'vui': [
            "Tuyệt vời! Mình rất vui khi nghe bạn nói như vậy! 😊 Bạn có thể kể cho mình nghe điều gì làm bạn vui không?",
            "Thật tuyệt! Niềm vui của bạn cũng làm mình vui theo! 🌟 Hãy chia sẻ thêm với mình nhé!",
            "Mình rất hạnh phúc khi thấy bạn vui! 💖 Điều gì đã mang lại niềm vui cho bạn hôm nay?"
        ],
        'buồn': [
            "Mình hiểu bạn đang buồn... 😔 Nhưng đừng lo, mình luôn ở đây để lắng nghe bạn. Bạn có muốn kể cho mình nghe không?",
            "Buồn là cảm xúc bình thường, mình cũng có lúc buồn. 💙 Hãy chia sẻ với mình, có thể mình sẽ giúp bạn cảm thấy tốt hơn!",
            "Mình thương bạn lắm! 🤗 Hãy nói cho mình biết điều gì làm bạn buồn, mình sẽ cố gắng giúp bạn!"
        ],
        'tức giận': [
            "Mình hiểu bạn đang tức giận... 😤 Nhưng hãy hít thở sâu và kể cho mình nghe chuyện gì đã xảy ra nhé!",
            "Tức giận là cảm xúc tự nhiên, nhưng quan trọng là cách chúng ta xử lý nó. 💪 Bạn có muốn chia sẻ với mình không?",
            "Mình ở đây để lắng nghe bạn! 🫂 Hãy kể cho mình nghe, có thể mình sẽ giúp bạn tìm cách giải quyết!"
        ],
        'sợ': [
            "Đừng sợ, mình ở đây với bạn! 🫂 Hãy kể cho mình nghe bạn đang sợ điều gì, mình sẽ giúp bạn vượt qua!",
            "Sợ hãi là điều bình thường, mình cũng có lúc sợ. 💙 Nhưng khi có ai đó bên cạnh, chúng ta sẽ mạnh mẽ hơn!",
            "Mình sẽ bảo vệ bạn! 🛡️ Hãy nói cho mình biết điều gì làm bạn sợ, chúng ta sẽ cùng nhau tìm cách!"
        ],
        'kể chuyện': [
            "Mình rất thích nghe bạn kể chuyện! 📖 Hãy kể cho mình nghe nhé, mình sẽ lắng nghe rất chăm chú!",
            "Kể chuyện là cách tuyệt vời để chia sẻ! ✨ Mình đang chờ đợi câu chuyện của bạn đây!",
            "Mình yêu thích những câu chuyện! 🎭 Hãy bắt đầu kể cho mình nghe nhé!"
        ],
        'giúp đỡ': [
            "Mình luôn sẵn sàng giúp đỡ bạn! 💡 Hãy nói cho mình biết bạn cần giúp gì nhé!",
            "Đừng ngại, mình ở đây để hỗ trợ bạn! 🤝 Bạn có thể tin tưởng mình!",
            "Mình sẽ cố gắng hết sức để giúp bạn! ⭐ Hãy chia sẻ vấn đề của bạn với mình!"
        ],
        'default': [
            "Mình hiểu bạn đang nói... 🤔 Hãy kể cho mình nghe thêm nhé!",
            "Thật thú vị! 😊 Bạn có thể chia sẻ thêm với mình không?",
            "Mình rất thích nghe bạn nói! 💖 Hãy tiếp tục kể cho mình nghe nhé!",
            "Cảm ơn bạn đã chia sẻ! 🌟 Mình muốn nghe thêm từ bạn!",
            "Bạn nói rất hay! ✨ Hãy kể cho mình nghe thêm nhé!"
        ]
    };

    // Function to add message to chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const currentTime = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        if (isUser) {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FF6B9D, #FF8FA3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">B</div>
                </div>
                <div class="message-content">
                    <p>${content}</p>
                    <span class="message-time">${currentTime}</span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="assets/images/pngegg (1).png" alt="Kẹo Ngọt" class="avatar-img">
                </div>
                <div class="message-content">
                    <p>${content}</p>
                    <span class="message-time">${currentTime}</span>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to get bot response
    function getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Check for keywords
        for (const [keyword, responses] of Object.entries(botResponses)) {
            if (keyword !== 'default' && message.includes(keyword)) {
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
        
        // Default response
        return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
    }

    // Function to send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;

        // Add user message
        addMessage(message, true);
        chatInput.value = '';

        // Disable input while bot is "thinking"
        sendButton.disabled = true;
        chatInput.disabled = true;

        // Simulate bot thinking time
        setTimeout(() => {
            const botResponse = getBotResponse(message);
            addMessage(botResponse);
            
            // Re-enable input
            sendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }, 1000 + Math.random() * 2000); // 1-3 seconds delay
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Quick response buttons
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            chatInput.value = message;
            sendMessage();
        });
    });

    // Focus input on load
    chatInput.focus();
});
