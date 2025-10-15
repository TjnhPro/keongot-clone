// Kham Pha Interactive Features
console.log('Kham Pha JS loaded!');

document.addEventListener('DOMContentLoaded', function(){
    const video = document.getElementById('musicPlayer');

    // Handle video buttons on kham-pha page
    document.querySelectorAll('.video-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active state
            document.querySelectorAll('.video-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const src = btn.getAttribute('data-src');
            if (video && src) {
                video.pause();
                video.src = src;
                video.load();
                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.catch(error => {
                        console.log('Video playback failed:', error);
                    });
                }
            }
        });
    });
});

// User Data Management
class UserProgress {
    constructor() {
        this.storageKey = 'keongot_user_progress';
        this.initData();
    }

    initData() {
            const defaultData = {
                currentPoints: 0,
                badges: [],
                level: 1,
            completedQuestionSets: 0,
                readStories: [],
                weeklyProgress: 0,
            questionSetScores: [null, null, null, null, null],
                totalStoriesRead: 0,
            totalQuestionSetsCompleted: 0,
                averageScore: 0,
                lastActivity: new Date().toISOString()
            };

        const existing = localStorage.getItem(this.storageKey);
        if (!existing) {
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
            return;
        }

        // Migrate old data structures safely
        try {
            const parsed = JSON.parse(existing) || {};
            // Backfill missing fields
            if (!Array.isArray(parsed.questionSetScores)) {
                parsed.questionSetScores = [null, null, null, null, null];
            } else if (parsed.questionSetScores.length < 5) {
                // Normalize to 5 entries
                while (parsed.questionSetScores.length < 5) parsed.questionSetScores.push(null);
            }
            if (typeof parsed.currentPoints !== 'number') parsed.currentPoints = 0;
            if (!Array.isArray(parsed.badges)) parsed.badges = [];
            if (typeof parsed.level !== 'number') parsed.level = 1;
            if (typeof parsed.completedQuestionSets !== 'number') parsed.completedQuestionSets = 0;
            if (!Array.isArray(parsed.readStories)) parsed.readStories = [];
            if (typeof parsed.weeklyProgress !== 'number') parsed.weeklyProgress = 0;
            if (typeof parsed.totalStoriesRead !== 'number') parsed.totalStoriesRead = 0;
            if (typeof parsed.totalQuestionSetsCompleted !== 'number') parsed.totalQuestionSetsCompleted = 0;
            if (typeof parsed.averageScore !== 'number') parsed.averageScore = 0;
            if (!parsed.lastActivity) parsed.lastActivity = new Date().toISOString();

            const merged = { ...defaultData, ...parsed };
            localStorage.setItem(this.storageKey, JSON.stringify(merged));
        } catch (e) {
            // Reset to defaults if corrupted
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    updateData(updates) {
        const data = this.getData();
        const newData = { ...data, ...updates, lastActivity: new Date().toISOString() };
        localStorage.setItem(this.storageKey, JSON.stringify(newData));
        this.updateUI();
    }

    addPoints(points) {
        const data = this.getData();
        const newPoints = data.currentPoints + points;
        const newLevel = Math.floor(newPoints / 500) + 1;
        this.updateData({ 
            currentPoints: newPoints,
            level: newLevel
        });
    }

    addBadge(badgeId) {
        const data = this.getData();
        if (!data.badges.includes(badgeId)) {
            this.updateData({ 
                badges: [...data.badges, badgeId]
            });
            
            // Add special unlock animation
            this.showBadgeUnlockAnimation(badgeId);
        }
    }
    
    showBadgeUnlockAnimation(badgeId) {
        // Find the badge element
        const badgeElement = document.querySelector(`[data-badge="${badgeId}"]`);
        if (badgeElement) {
            // Add celebration effect
            badgeElement.classList.add('badge-unlock-celebration');
            
            // Create confetti effect
            this.createConfettiEffect(badgeElement);
            
            // Remove celebration class after animation
            setTimeout(() => {
                badgeElement.classList.remove('badge-unlock-celebration');
            }, 3000);
        }
    }
    
    createConfettiEffect(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#4ECDC4', '#44A08D', '#26D0CE', '#FFD700', '#FF6B6B', '#4ECDC4'];
        
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = rect.left + rect.width / 2 + 'px';
            confetti.style.top = rect.top + rect.height / 2 + 'px';
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            
            // Random direction and speed
            const angle = Math.random() * 360;
            const velocity = 50 + Math.random() * 100;
            const vx = Math.cos(angle * Math.PI / 180) * velocity;
            const vy = Math.sin(angle * Math.PI / 180) * velocity;
            
            document.body.appendChild(confetti);
            
            // Animate confetti
            let x = 0, y = 0;
            const animate = () => {
                x += vx * 0.02;
                y += vy * 0.02 + 0.5; // gravity
                confetti.style.transform = `translate(${x}px, ${y}px)`;
                confetti.style.opacity = 1 - (y / 200);
                
                if (y < 200 && confetti.style.opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    confetti.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
    }

    completeQuestionSet(questionSetIndex, score) {
        const data = this.getData();
        const newScores = [...data.questionSetScores];
        newScores[questionSetIndex] = score;
        
        // Check if this is the first completion of any question set
        const wasFirstCompletion = data.questionSetScores.every(score => score === null);
        
        // Check for emotion expert badge on first completion with good score
        if (wasFirstCompletion && score >= 70) {
            this.addBadge('emotion_expert');
        }
        
        // Count completed sets
        const completedCount = newScores.filter(score => score !== null).length;
        const completedScores = newScores.filter(score => score !== null);
        const averageScore = completedScores.length > 0 ? 
            completedScores.reduce((a, b) => a + b, 0) / completedScores.length : 0;
        
        this.updateData({
            completedQuestionSets: completedCount,
            totalQuestionSetsCompleted: completedCount,
            questionSetScores: newScores,
            averageScore: Math.round(averageScore * 10) / 10
        });

        // Add points based on score
        const points = Math.round(score * 20);
        this.addPoints(points);

        // Check for badge achievements
        if (completedCount >= 5) {
            this.addBadge('question_master');
        }
        
        // Check for explorer badge (complete all activities)
        if (data.totalStoriesRead >= 6 && completedCount >= 5) {
            this.addBadge('explorer');
        }
    }
    
    updateQuizSelectionCards() {
        const data = this.getData();
        
        for (let i = 0; i < 5; i++) {
            const card = document.querySelector(`[data-quiz="${i}"]`);
            const statusElement = document.getElementById(`status-${i}`);
            const scoreElement = document.getElementById(`score-${i}`);
            const button = card?.querySelector('.start-quiz-btn');
            
            if (card && statusElement && scoreElement && button) {
                const score = data.questionSetScores[i];
                
                if (score !== null) {
                    // Completed
                    card.classList.add('completed');
                    statusElement.textContent = 'Đã hoàn thành';
                    statusElement.className = 'quiz-status completed';
                    scoreElement.textContent = `${score}%`;
                    scoreElement.className = 'quiz-score completed';
                    button.textContent = 'Làm lại';
                } else {
                    // Not started
                    card.classList.remove('completed');
                    statusElement.textContent = 'Chưa làm';
                    statusElement.className = 'quiz-status not-started';
                    scoreElement.textContent = 'Chưa có điểm';
                    scoreElement.className = 'quiz-score not-started';
                    button.textContent = 'Bắt đầu';
                }
            }
        }
    }

    readStory(storyId) {
        const data = this.getData();
        if (!data.readStories.includes(storyId)) {
            this.updateData({
                readStories: [...data.readStories, storyId],
                totalStoriesRead: data.totalStoriesRead + 1
            });

            // Add points for reading story
            this.addPoints(50);

            // Check for badge achievements
            if (data.totalStoriesRead + 1 >= 6) {
                this.addBadge('bookworm');
            }
            
            // Check for storyteller badge (read all stories and complete quizzes)
            if (data.totalStoriesRead >= 6 && data.totalQuestionSetsCompleted >= 3) {
                this.addBadge('storyteller');
            }
            
            // Check for helper badge (help others by sharing progress)
            if (data.totalStoriesRead >= 4 && data.totalQuestionSetsCompleted >= 2) {
                this.addBadge('helper');
            }
        }
    }

    updateUI() {
        const data = this.getData();
        
        // Update points display
        const pointsElement = document.getElementById('currentPoints');
        if (pointsElement) {
            pointsElement.textContent = data.currentPoints.toLocaleString();
        }

        // Update level display
        const levelElement = document.getElementById('currentLevel');
        if (levelElement) {
            levelElement.textContent = `Cấp ${data.level}`;
        }

        // Update badge count
        const badgeElement = document.getElementById('badgeCount');
        if (badgeElement) {
            badgeElement.textContent = `${data.badges.length}/6`;
        }

        // Update progress stats in the progress section
        const storyProgress = document.querySelector('.progress-item:nth-child(1) .progress-value');
        if (storyProgress) {
            storyProgress.textContent = `${data.totalStoriesRead}/6`;
        }

        const questionSetProgress = document.querySelector('.progress-item:nth-child(2) .progress-value');
        if (questionSetProgress) {
            questionSetProgress.textContent = `${data.totalQuestionSetsCompleted}/5`;
        }

        const avgScore = document.querySelector('.progress-item:nth-child(3) .progress-value');
        if (avgScore) {
            avgScore.textContent = `${data.averageScore}/10`;
        }
        
        // Update quiz selection cards
        this.updateQuizSelectionCards();

        // Update weekly progress
        const weeklyProgress = Math.min((data.totalStoriesRead + data.totalQuestionSetsCompleted) * 15, 100);
        
        // Update circular progress ring
        const progressCircle = document.querySelector('.progress-ring-circle');
        if (progressCircle) {
            const circumference = 2 * Math.PI * 50; // radius = 50
            const offset = circumference - (weeklyProgress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        // Update progress text
        const progressPercentage = document.querySelector('.progress-ring-percentage');
        if (progressPercentage) {
            progressPercentage.textContent = weeklyProgress + '%';
        }

        // Animate progress chart
        this.animateProgressChart(weeklyProgress);

        // Update badge display
        this.updateBadgeDisplay(data.badges);
    }

    updateBadgeDisplay(earnedBadges) {
        const badgeItems = document.querySelectorAll('.badge-item');
        const badgeIcons = [
            'fas fa-bullseye',
            'fas fa-book', 
            'fas fa-heart',
            'fas fa-pen-fancy',
            'fas fa-hands-helping',
            'fas fa-search'
        ];
        
        badgeItems.forEach((item, index) => {
            const badgeIds = ['question_master', 'bookworm', 'emotion_expert', 'storyteller', 'helper', 'explorer'];
            const badgeId = badgeIds[index];
            
            if (earnedBadges.includes(badgeId)) {
                item.classList.remove('locked');
                item.classList.add('earned');
                item.setAttribute('data-badge', badgeId);
                const icon = item.querySelector('.badge-icon i');
                if (icon) {
                    icon.className = badgeIcons[index];
                }
            } else {
                item.classList.add('locked');
                item.classList.remove('earned');
                item.removeAttribute('data-badge');
                const icon = item.querySelector('.badge-icon i');
                if (icon) {
                    icon.className = 'fas fa-lock';
                }
            }
        });
    }
    
    animateProgressChart(percentage) {
        const chartFill = document.getElementById('chartFill');
        const chartPercentage = document.getElementById('chartPercentage');
        const milestones = document.querySelectorAll('.milestone');
        
        if (!chartFill || !chartPercentage) return;
        
        // Reset to 0
        chartFill.style.width = '0%';
        chartPercentage.textContent = '0%';
        
        // Animate to target percentage
        setTimeout(() => {
            chartFill.style.width = `${percentage}%`;
            chartPercentage.textContent = `${percentage}%`;
            
            // Add bounce animation to percentage
            chartPercentage.classList.add('animate');
            setTimeout(() => {
                chartPercentage.classList.remove('animate');
            }, 600);
            
            // Activate milestones based on percentage
            milestones.forEach(milestone => {
                const milestonePercent = parseInt(milestone.dataset.percent);
                if (percentage >= milestonePercent) {
                    milestone.classList.add('active');
                } else {
                    milestone.classList.remove('active');
                }
            });
            
            // Add sparkles if 100%
            if (percentage >= 100) {
                this.addSparkles();
            }
        }, 100);
    }
    
    addSparkles() {
        const sparklesContainer = document.getElementById('chartSparkles');
        if (!sparklesContainer) return;
        
        // Create multiple sparkles
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.position = 'absolute';
            sparkle.style.fontSize = '14px';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 20 + 'px';
            sparkle.style.animation = `sparkle 1.5s infinite`;
            sparkle.style.animationDelay = Math.random() * 1 + 's';
            sparkle.style.pointerEvents = 'none';
            
            sparklesContainer.appendChild(sparkle);
            
            // Remove sparkle after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 3000);
        }
    }
}

// Initialize user progress
const userProgress = new UserProgress();

// Question Set System - Split into smaller question sets
const QUESTION_SET_SIZE = 10; // 10 questions per question set
const quizData = [
  {
    "question": "Khi em cảm thấy buồn, em nên làm gì?",
    "options": [
      "Giấu kín trong lòng",
      "La hét với mọi người",
      "Chia sẻ với người mà em tin tưởng",
      "Tự trách bản thân"
    ],
    "correct": 2,
    "explanation": "Chia sẻ cảm xúc với người tin tưởng giúp em được lắng nghe và nhận được hỗ trợ cụ thể điều này giúp giảm áp lực trong lòng và tìm cách giải quyết. Khi nói ra, em cũng dễ nhận ra nguyên nhân cảm xúc và học được cách quản lý chúng. Giấu kín hay tự trách thường làm cảm xúc nặng thêm và có thể dẫn đến stress kéo dài."
  },
  {
    "question": "Khi bạn thân không chơi với em nữa, em nên:",
    "options": [
      "Cãi nhau lại",
      "Hỏi bạn xem có chuyện gì xảy ra",
      "Bỏ mặc bạn",
      "Nói xấu bạn"
    ],
    "correct": 1,
    "explanation": "Hỏi thẳng một cách lịch sự cho phép em biết lý do và tìm cách giải quyết giao tiếp trực tiếp giúp tránh hiểu lầm. Phản ứng tiêu cực như cãi nhau hay nói xấu thường làm tình huống tệ hơn và phá hủy mối quan hệ. Dù kết quả thế nào, việc hỏi cho thấy em tôn trọng mối quan hệ và học được kỹ năng giải quyết mâu thuẫn."
  },
  {
    "question": "Em cảm thấy thế nào khi được khen ngợi?",
    "options": [
      "Vui và tự hào",
      "Lo lắng",
      "Bình thường",
      "Giận dữ"
    ],
    "correct": 0,
    "explanation": "Cảm thấy vui và tự hào khi được khen là phản ứng tự nhiên; khen ngợi củng cố hành vi tích cực và tăng tự tin. Tuy nhiên cần biết tiếp nhận khen một cách khiêm tốn và không ỷ lại dùng nó làm động lực để tiếp tục cố gắng. Nếu em cảm thấy lo lắng khi được khen, có thể do sợ kỳ vọng; nhận diện điều đó sẽ giúp em xử lý cảm xúc tốt hơn."
  },
  {
    "question": "Khi em thấy một bạn khác bị bắt nạt, em nên:",
    "options": [
      "Làm ngơ",
      "Cười cùng nhóm bắt nạt",
      "Báo cho thầy cô hoặc người lớn",
      "Quay video lại"
    ],
    "correct": 2,
    "explanation": "Báo cho người lớn đáng tin cậy giúp can thiệp kịp thời và bảo vệ người bị bắt nạt, quay phim hoặc làm ngơ có thể làm tình huống kéo dài. Giúp đỡ nạn nhân hoặc tìm người lớn cho thấy em biết đứng về điều đúng và có trách nhiệm. Hành động an toàn và đúng mực cũng bảo vệ chính em khỏi rủi ro."
  },
  {
    "question": "Nếu em làm sai điều gì, việc đầu tiên nên làm là:",
    "options": [
      "Giấu đi",
      "Nhận lỗi và xin lỗi",
      "Đổ lỗi cho người khác",
      "Làm như không có gì"
    ],
    "correct": 1,
    "explanation": "Nhận lỗi và xin lỗi là bước đầu để sửa sai và lấy lại niềm tin, nó cho thấy trách nhiệm và trưởng thành. Việc này giúp học được bài học từ sai lầm và xây dựng mối quan hệ bền vững. Trái lại, giấu lỗi hay đổ thừa sẽ dẫn tới hậu quả lớn hơn và mất lòng tin."
  },
  {
    "question": "Khi em cảm thấy lo lắng trước một bài kiểm tra, em nên:",
    "options": [
      "Hít thở sâu, ôn lại kiến thức và tin vào bản thân",
      "Cố gắng quên đi",
      "Than phiền với bạn bè",
      "Tự trách mình kém cỏi"
    ],
    "correct": 0,
    "explanation": "Kỹ thuật hít thở giúp giảm stress tức thì, còn ôn luyện giúp em cảm thấy sẵn sàng cả hai kết hợp làm giảm lo lắng. Tin vào bản thân là cách xây dựng thái độ tích cực, quan trọng hơn việc than phiền hay né tránh. Tự trách chỉ làm tâm trạng tệ hơn và không cải thiện hiệu suất."
  },
  {
    "question": "Cảm xúc “ghen tị” xuất hiện khi:",
    "options": [
      "Em mong muốn có được điều mà người khác có",
      "Em vui khi bạn mình thành công",
      "Em không thích ai cả",
      "Em thấy buồn ngủ"
    ],
    "correct": 0,
    "explanation": "Ghen tị thường bắt nguồn từ mong muốn hoặc cảm thấy thiếu thốn, đó là tín hiệu để em hiểu giá trị bản thân và mục tiêu cá nhân. Nhận diện cảm xúc này giúp biến nó thành động lực để phát triển thay vì ghen ghét. Học cách so sánh lành mạnh và tập trung vào mục tiêu bản thân sẽ giảm cảm giác tiêu cực."
  },
  {
    "question": "Khi em tức giận, cách thể hiện đúng là:",
    "options": [
      "Nói với người khác rằng em đang tức giận, nhưng bằng lời bình tĩnh",
      "La hét thật to",
      "Im lặng rồi tránh mặt mãi",
      "Viết lời xúc phạm"
    ],
    "correct": 0,
    "explanation": "Thổ lộ cảm xúc bằng ngôn ngữ bình tĩnh giúp người khác hiểu và cùng giải quyết vấn đề mà không gây tổn thương. Giữ im lặng quá mức hoặc bộc phát bằng hành vi xấu đều không giúp giải quyết nguyên nhân. Kỹ năng diễn đạt cảm xúc rõ ràng là một phần quan trọng của quản lý cơn giận."
  },
  {
    "question": "Một người hiểu rõ cảm xúc bản thân là người:",
    "options": [
      "Biết mình đang cảm thấy gì và vì sao",
      "Giấu hết cảm xúc",
      "Không bao giờ khóc",
      "Luôn vui vẻ dù gặp chuyện gì"
    ],
    "correct": 0,
    "explanation": "Hiểu cảm xúc có nghĩa là nhận diện loại cảm xúc và nguyên nhân điều này giúp chọn cách phản ứng phù hợp. Người hiểu cảm xúc có thể điều chỉnh hành vi và tìm cách hỗ trợ bản thân khi cần. Không phải là không có cảm xúc mà là biết quản lý chúng một cách lành mạnh."
  },
  {
    "question": "Khi em thấy buồn lâu ngày, việc nên làm nhất là:",
    "options": [
      "Chia sẻ với bố mẹ, thầy cô hoặc chuyên gia tâm lý học đường",
      "Cố tỏ ra mạnh mẽ",
      "Ở một mình",
      "Không nói với ai"
    ],
    "correct": 0,
    "explanation": "Buồn kéo dài có thể là dấu hiệu cần sự hỗ trợ chuyên môn, chia sẻ giúp phát hiện nguyên nhân và nhận được giúp đỡ phù hợp. Ở một mình hay che giấu cảm xúc có thể làm tình trạng tệ hơn. Thầy cô, cha mẹ hoặc chuyên gia có thể đưa ra lời khuyên, hỗ trợ và can thiệp kịp thời."
  },
   {
    "question": "Khi nói chuyện với người khác, điều quan trọng nhất là:",
    "options": [
      "Nói thật to",
      "Nói thật nhanh",
      "Lắng nghe và tôn trọng người khác",
      "Luôn đúng ý mình"
    ],
    "correct": 2,
    "explanation": "Giao tiếp hiệu quả bắt đầu bằng lắng nghe khi em lắng nghe, em hiểu được quan điểm người khác và phản hồi phù hợp. Tôn trọng giúp tạo môi trường an toàn để chia sẻ. Nói to hay nhanh không bằng hiểu và tôn trọng."
  },
  {
    "question": "Nếu bạn trong lớp bị điểm kém, em nên nói gì?",
    "options": [
      "Không sao đâu, lần sau cố gắng nhé!",
      "Cậu dở quá!",
      "Tớ điểm cao hơn cậu đấy!",
      "Tớ không quan tâm"
    ],
    "correct": 0,
    "explanation": "Lời động viên giúp duy trì tự tôn của bạn và khuyến khích nỗ lực cải thiện. Chê bai hoặc so sánh sẽ làm tổn thương và có thể gây xung đột. Hỗ trợ tinh thần là phần quan trọng của kỹ năng giao tiếp."
  },
  {
    "question": "Khi tranh luận, để tránh cãi nhau, em nên:",
    "options": [
      "Nói át người khác",
      "Lắng nghe và nói bình tĩnh",
      "Bỏ đi không nói gì",
      "Nổi giận"
    ],
    "correct": 1,
    "explanation": "Tranh luận xây dựng khi có lắng nghe và trao đổi tôn trọng; giữ bình tĩnh giúp giữ trọng tâm vào vấn đề. Nói át hay nổi giận thường làm mất tính xây dựng. Kỹ năng giải quyết mâu thuẫn dựa trên lắng nghe chủ động."
  },
  {
    "question": "Khi em cần giúp đỡ, em nên:",
    "options": [
      "Giấu cảm xúc",
      "Nói rõ điều mình cần",
      "Mong người khác tự hiểu",
      "Tránh né"
    ],
    "correct": 1,
    "explanation": "Nói rõ điều cần giúp đỡ giúp người khác hiểu và đưa ra hỗ trợ chính xác; im lặng khiến mọi người không biết em gặp khó khăn. Học cách yêu cầu giúp đỡ là dấu hiệu trưởng thành và tự lực. Thẳng thắn nhưng lịch sự tạo kết quả tốt hơn."
  },
  {
    "question": "Nếu em vô tình làm bạn buồn, em nên:",
    "options": [
      "Không để ý",
      "Xin lỗi và tìm cách làm hòa",
      "Trách bạn quá nhạy cảm",
      "Lờ đi"
    ],
    "correct": 1,
    "explanation": "Xin lỗi chân thành và nỗ lực sửa sai cho thấy tôn trọng cảm xúc người khác và giúp hàn gắn mối quan hệ. Bỏ qua hoặc đổ lỗi sẽ khiến mối quan hệ xấu đi. Học cách nhận biết khi mình vô tình gây tổn thương là phần quan trọng của trưởng thành."
  },
  {
    "question": "Khi bạn nói chuyện nhưng em không hiểu ý, em nên:",
    "options": [
      "Hỏi lại một cách lịch sự",
      "Gật đầu đại cho xong",
      "Cười trừ",
      "Bỏ đi"
    ],
    "correct": 0,
    "explanation": "Hỏi lại giúp làm rõ thông tin và tránh hiểu lầm; đây là hành vi chủ động trong giao tiếp. Gật đầu hay bỏ qua có thể dẫn đến sai sót trong công việc hoặc quan hệ. Hỏi là dấu hiệu của sự tôn trọng và trách nhiệm."
  },
  {
    "question": "Khi giao tiếp, ánh mắt thể hiện điều gì?",
    "options": [
      "Sự lắng nghe và tôn trọng",
      "Sự sợ hãi",
      "Sự tức giận",
      "Thờ ơ"
    ],
    "correct": 0,
    "explanation": "Ánh mắt phù hợp (nhìn khi nói chuyện) truyền đạt sự chú ý và tôn trọng; nó giúp người nói cảm thấy được trân trọng. Tránh ánh mắt hoàn toàn có thể bị hiểu nhầm là thiếu quan tâm. Tuy nhiên cần giữ sự tế nhị để không gây khó chịu cho người khác."
  },
  {
    "question": "Nếu bạn góp ý cho em điều chưa đúng, em nên:",
    "options": [
      "Cảm ơn bạn và xem xét lại",
      "Cãi lại ngay",
      "Cho rằng bạn sai",
      "Giận và không chơi nữa"
    ],
    "correct": 0,
    "explanation": "Tiếp nhận góp ý với thái độ cởi mở cho phép em học hỏi và hoàn thiện bản thân. Cảm ơn không có nghĩa là đồng ý ngay mà là tôn trọng nỗ lực giúp đỡ. Trách móc hay cãi lại ngay thường làm mất cơ hội phát triển."
  },
  {
    "question": "Khi em kể chuyện với người khác, cần nhớ:",
    "options": [
      "Không nói xấu, không làm tổn thương người khác",
      "Nói sao cũng được",
      "Càng phóng đại càng hay",
      "Không cần kiểm tra đúng sai"
    ],
    "correct": 0,
    "explanation": "Truyền đạt trung thực và tôn trọng giúp bảo vệ danh dự người khác và xây dựng lòng tin. Nói xấu hay thêu dệt có thể gây hậu quả xã hội và tổn thương người bị nói đến. Thành thật và có trách nhiệm khi kể chuyện là kỹ năng đạo đức quan trọng."
  },
  {
    "question": "Giao tiếp hiệu quả là khi:",
    "options": [
      "Hai bên hiểu, tôn trọng và hợp tác với nhau",
      "Chỉ một người nói",
      "Ai to tiếng hơn là người thắng",
      "Nói cho vui thôi"
    ],
    "correct": 0,
    "explanation": "Giao tiếp hiệu quả là quá trình tương tác hai chiều, trong đó cả hai bên lắng nghe và thấu hiểu nhau để cùng hành động. Nếu chỉ một người nói hoặc giành 'chiến thắng' bằng tiếng lớn, thông điệp thực sự có thể bị mất. Mục tiêu là xây dựng sự hiểu biết và hợp tác."
  },
    {
    "question": "Khi gặp khó khăn, điều tốt nhất nên làm là:",
    "options": [
      "Bình tĩnh và tìm cách giải quyết",
      "Bỏ cuộc ngay",
      "Than phiền với mọi người",
      "Đổ lỗi cho hoàn cảnh"
    ],
    "correct": 0,
    "explanation": "Giữ bình tĩnh giúp suy nghĩ rõ, xác định nguyên nhân và tìm giải pháp khả thi. Bỏ cuộc hay đổ lỗi làm mất cơ hội học hỏi và trưởng thành. Khả năng giải quyết vấn đề là một kỹ năng sống quan trọng giúp em tự lập."
  },
  {
    "question": "Em có thể rèn tính kiên nhẫn bằng cách:",
    "options": [
      "Thử lại nhiều lần khi chưa thành công",
      "Làm qua loa cho nhanh",
      "Tránh việc khó",
      "Nhờ người khác làm giúp"
    ],
    "correct": 0,
    "explanation": "Kiên nhẫn xây dựng qua thực hành lặp lại và chấp nhận rằng tiến bộ cần thời gian. Tránh việc khó chỉ kéo dài tình trạng không tiến bộ. Thử lại cho thấy sự kiên trì và giúp tăng năng lực tự giải quyết."
  },
  {
    "question": "Khi em giúp đỡ người khác, cảm xúc thường là:",
    "options": [
      "Vui và tự hào",
      "Lo lắng",
      "Giận dữ",
      "Mệt mỏi"
    ],
    "correct": 0,
    "explanation": "Giúp đỡ người khác thường mang lại cảm giác thỏa mãn và tăng giá trị bản thân đó là một phần của khỏe mạnh tinh thần xã hội. Tuy nhiên cần biết giữ giới hạn nếu việc giúp gây hại cho bản thân. Cảm giác vui sau khi giúp là động lực để tiếp tục làm việc tốt."
  },
  {
    "question": "Kỹ năng quản lý thời gian tốt là:",
    "options": [
      "Làm việc gì thích trước",
      "Làm ngẫu nhiên",
      "Lập kế hoạch và làm theo thứ tự ưu tiên",
      "Làm đến đâu hay đến đó"
    ],
    "correct": 2,
    "explanation": "Lập kế hoạch và ưu tiên giúp hoàn thành nhiệm vụ quan trọng, giảm áp lực và đạt hiệu suất cao hơn. Làm việc theo cảm hứng hay ngẫu nhiên thường dẫn đến trì hoãn và thiếu hiệu quả. Kỹ năng này rất hữu ích trong học tập và cuộc sống."
  },
  {
    "question": "Khi bị thầy cô nhắc nhở, em nên:",
    "options": [
      "Giận dữ và cãi lại",
      "Lắng nghe và sửa sai",
      "Khóc lóc",
      "Nói xấu thầy cô"
    ],
    "correct": 1,
    "explanation": "Lắng nghe khi bị nhắc nhở cho phép em hiểu lý do và cải thiện hành vi, đây là thái độ cầu tiến. Phản ứng tiêu cực thường làm mối quan hệ giáo viên học sinh xấu đi. Sửa sai thể hiện trách nhiệm và trưởng thành."
  },
  {
    "question": "Khi gặp thất bại, người mạnh mẽ sẽ:",
    "options": [
      "Tìm nguyên nhân và rút kinh nghiệm để làm lại",
      "Từ bỏ ngay",
      "Đổ lỗi cho may mắn",
      "Nản chí và than vãn"
    ],
    "correct": 0,
    "explanation": "Thất bại là cơ hội học hỏi, phân tích nguyên nhân giúp tránh lặp lại sai lầm và phát triển kỹ năng. Từ bỏ hoặc đổ lỗi ngăn cản sự tiến bộ. Kiên trì và sửa đổi chiến lược là dấu hiệu của sức mạnh nội tâm."
  },
  {
    "question": "Em có thể rèn tính kỷ luật bằng cách:",
    "options": [
      "Làm đúng kế hoạch, dù đôi khi không thích",
      "Làm theo cảm hứng",
      "Đợi người khác nhắc",
      "Trì hoãn liên tục"
    ],
    "correct": 0,
    "explanation": "Kỷ luật đòi hỏi quyết tâm thực hiện kế hoạch ngay cả khi không có hứng; điều này tạo ra thói quen tích cực. Trì hoãn và phụ thuộc vào người khác sẽ làm mất cơ hội phát triển. Kỷ luật giúp em đạt mục tiêu dài hạn."
  },
  {
    "question": "Khi em giúp người khác nhưng không được cảm ơn, em nên:",
    "options": [
      "Vẫn vui vì mình đã làm điều đúng",
      "Thấy bực và hối hận",
      "Quyết không giúp nữa",
      "Nói cho cả lớp biết"
    ],
    "correct": 0,
    "explanation": "Giúp mà không mong điều đáp trả là hành vi có giá trị nội tại, niềm vui đến từ việc làm điều đúng chứ không phải từ lời cảm ơn. Nếu cảm thấy bị lợi dụng, em có thể điều chỉnh giới hạn trong lần sau. Giữ thái độ thiện chí giúp duy trì lòng tốt lâu dài."
  },
  {
    "question": "Khi làm việc nhóm, nếu ý kiến em không được chọn, em nên:",
    "options": [
      "Tôn trọng ý kiến chung và tiếp tục đóng góp",
      "Giận dỗi",
      "Không tham gia nữa",
      "Cãi đến cùng"
    ],
    "correct": 0,
    "explanation": "Tôn trọng quyết định nhóm giúp đạt mục tiêu chung, em vẫn có thể đóng góp ý khác trong tương lai. Cãi vã hay rút lui làm giảm hiệu quả tập thể. Làm việc nhóm đòi hỏi tinh thần hợp tác và linh hoạt."
  },
  {
    "question": "“Tự tin” nghĩa là:",
    "options": [
      "Tin vào khả năng của bản thân và dám thử thách",
      "Luôn nghĩ mình giỏi hơn người khác",
      "Không bao giờ sợ hãi",
      "Bắt buộc người khác nghe theo mình"
    ],
    "correct": 0,
    "explanation": "Tự tin là nhận biết khả năng và chấp nhận thử thách, đồng thời biết giới hạn và học hỏi tiếp. Nó khác với kiêu ngạo tự tin kết hợp với khiêm tốn giúp em tiến bộ. Sợ hãi tồn tại nhưng tự tin giúp em vượt qua nó."
  },
    {
    "question": "Nếu bạn mới chuyển đến lớp, em nên làm gì?",
    "options": [
      "Chào hỏi và làm quen",
      "Ngó lơ bạn",
      "Nói chuyện riêng với nhóm mình",
      "Đợi bạn tự làm quen"
    ],
    "correct": 0,
    "explanation": "Chào hỏi thân thiện giúp bạn mới cảm thấy được chào đón và dễ hòa nhập. Hành động nhỏ như giới thiệu bản thân có thể mở ra mối quan hệ mới. Ngó lơ khiến người đó cô lập và có thể gây mất đoàn kết."
  },
  {
    "question": "Khi thấy người khác đang nói chuyện, em nên:",
    "options": [
      "Chờ họ nói xong rồi mới nói",
      "Cắt lời",
      "La to để họ nghe mình",
      "Bỏ đi"
    ],
    "correct": 0,
    "explanation": "Chờ người khác kết thúc thể hiện sự tôn trọng và giúp cuộc trò chuyện trôi chảy. Cắt lời hay la hét làm gián đoạn và có thể gây mâu thuẫn. Kỹ năng chờ lượt là phần của giao tiếp lịch sự."
  },
  {
    "question": "Nếu em làm mất đồ của bạn, em nên:",
    "options": [
      "Giấu đi",
      "Thú nhận và xin lỗi",
      "Nói là không biết",
      "Đổ lỗi cho người khác"
    ],
    "correct": 1,
    "explanation": "Thú nhận lỗi và xin lỗi là cách minh bạch, giúp người bị mất biết tình hình và tìm giải pháp bù đắp. Giấu hay chối bỏ sẽ làm mất uy tín và làm tổn hại quan hệ. Hành động sửa sai (tìm lại hoặc đền bù) quan trọng hơn lời nói."
  },
  {
    "question": "Khi tham gia hoạt động nhóm, điều quan trọng là:",
    "options": [
      "Hợp tác và lắng nghe ý kiến mọi người",
      "Chỉ làm theo ý mình",
      "Không cần đóng góp",
      "Làm cho xong"
    ],
    "correct": 0,
    "explanation": "Hợp tác và tôn trọng ý kiến giúp nhóm tận dụng sức mạnh tập thể và đạt kết quả tốt hơn. Làm theo ý mình một mình có thể dẫn đến xung đột và kết quả kém. Đóng góp xây dựng là trách nhiệm của mỗi thành viên."
  },
  {
    "question": "Khi em cảm thấy tức giận, cách tốt nhất là:",
    "options": [
      "Hít thở sâu và bình tĩnh lại",
      "La hét",
      "Đập đồ",
      "Giữ cơn giận trong lòng"
    ],
    "correct": 0,
    "explanation": "Kỹ thuật hít thở giúp giảm phản ứng sinh lý của giận dữ, cho em thời gian để suy nghĩ trước khi hành động. Hành vi bộc phát hoặc dồn nén đều có thể gây hại — tìm cách thể hiện hợp lý là lựa chọn an toàn. Học phương pháp bình tĩnh giúp duy trì mối quan hệ và kiểm soát cảm xúc."
  },
  {
    "question": "Khi thấy hai bạn cãi nhau, em nên:",
    "options": [
      "Khuyên các bạn bình tĩnh và lắng nghe nhau",
      "Đứng xem cho vui",
      "Kể lại với người khác",
      "Chọc cho hai bạn cãi to hơn"
    ],
    "correct": 0,
    "explanation": "Khuyên bình tĩnh giúp hạ nhiệt cảm xúc và mở cơ hội cho trao đổi lý trí. Là người hòa giải góp phần xây dựng môi trường học đường an toàn. Kể lể hay chọc ghẹo chỉ làm tình hình tệ hơn và có thể gây hậu quả."
  },
  {
    "question": "Nếu thầy cô quên khen em khi em làm tốt, em nên:",
    "options": [
      "Tiếp tục cố gắng vì bản thân",
      "Thấy buồn và không làm nữa",
      "Nói xấu thầy cô",
      "Đòi hỏi được khen"
    ],
    "correct": 0,
    "explanation": "Động lực nội tại (làm vì bản thân) bền vững hơn việc chỉ chờ khen ngoài. Nếu cần, em có thể chủ động chia sẻ thành quả với thầy cô để họ biết. Phản ứng tiêu cực dễ làm mất cơ hội được ghi nhận sau này."
  },
  {
    "question": "Khi ở nơi công cộng (thư viện, bệnh viện, lớp học), em cần:",
    "options": [
      "Giữ trật tự và tôn trọng mọi người xung quanh",
      "Muốn nói gì thì nói",
      "Chơi đùa to tiếng",
      "Không quan tâm người khác"
    ],
    "correct": 0,
    "explanation": "Giữ trật tự giúp mọi người sử dụng không gian chung được thoải mái và an toàn. Tôn trọng công cộng thể hiện văn minh và ý thức xã hội. Hành vi thiếu tôn trọng có thể gây phiền hà và hậu quả xã hội."
  },
  {
    "question": "Nếu bạn làm sai và bị mọi người trách, em nên:",
    "options": [
      "Bảo vệ bạn, giúp bạn sửa sai",
      "Chê bạn trước lớp",
      "Cười vì không liên quan",
      "Quay lưng đi"
    ],
    "correct": 0,
    "explanation": "Hỗ trợ bạn sửa sai tốt hơn là buông lời chỉ trích; điều đó giúp bạn học và cải thiện. Chê bai công khai làm tổn thương và không mang tính xây dựng. Thể hiện tinh thần đồng đội là giá trị quan trọng trong ứng xử."
  },
  {
    "question": "Khi có mâu thuẫn trong nhóm, cách giải quyết tốt nhất là:",
    "options": [
      "Ngồi lại cùng nhau, lắng nghe và thống nhất cách làm",
      "Chia phe",
      "Ai mạnh hơn thì thắng",
      "Bỏ cuộc"
    ],
    "correct": 0,
    "explanation": "Ngồi lại trao đổi giúp mọi thành viên hiểu nhau, tìm giải pháp chung và tăng trách nhiệm tập thể. Chia phe hay áp đặt làm giảm hiệu quả và gây xung đột kéo dài. Giải quyết bằng đối thoại là kỹ năng sống thiết yếu."
  },
    {
    "question": "Khi cơ thể em bắt đầu thay đổi (cao lên, mọc tóc, vỡ giọng, có kinh nguyệt…), điều đó nghĩa là:",
    "options": [
      "Em bị bệnh",
      "Cơ thể em đang lớn và phát triển bình thường",
      "Cần phải giấu mọi người",
      "Không nên nói với ai"
    ],
    "correct": 1,
    "explanation": "Những thay đổi này là dấu hiệu dậy thì — quá trình tự nhiên khi cơ thể trưởng thành. Biết điều này giúp em không sợ hãi và chuẩn bị chăm sóc bản thân tốt hơn. Nếu có thắc mắc, em nên hỏi người lớn đáng tin để được giải thích rõ hơn."
  },
  {
    "question": "Em nên làm gì nếu ai đó chạm vào người em khiến em thấy khó chịu hoặc sợ hãi?",
    "options": [
      "Giữ im lặng vì sợ bị la",
      "Nói “Không!” và kể ngay cho cha mẹ, thầy cô",
      "Bỏ qua vì chuyện nhỏ",
      "Giấu kín để không ai biết"
    ],
    "correct": 1,
    "explanation": "Bảo vệ bản thân là ưu tiên; nói “Không” rõ ràng và báo cho người lớn giúp đảm bảo an toàn và can thiệp kịp thời. Giấu kín có thể khiến hành vi lạm dụng tiếp tục. Người lớn có trách nhiệm giúp em và xử lý tình huống."
  },
  {
    "question": "Phần cơ thể nào được gọi là “vùng riêng tư” mà chỉ mình em được chạm vào khi vệ sinh hoặc tắm rửa?",
    "options": [
      "Ngực, mông và vùng giữa hai chân",
      "Tay và chân",
      "Mặt và tóc",
      "Vai và đầu gối"
    ],
    "correct": 0,
    "explanation": "Vùng riêng tư là những phần cơ thể nhạy cảm, không ai có quyền chạm trừ khi để chăm sóc y tế bởi người lớn đáng tin và trong hoàn cảnh phù hợp. Biết giới hạn này giúp em nhận diện và nói “Không” khi có hành vi xâm phạm. Đây cũng là cơ sở để phòng tránh lạm dụng."
  },
  {
    "question": "Khi bạn khác giới muốn ôm hoặc nắm tay, em nên:",
    "options": [
      "Từ chối nếu em cảm thấy không thoải mái",
      "Cười cho qua",
      "Đồng ý vì không muốn mất lòng",
      "Giữ im lặng"
    ],
    "correct": 0,
    "explanation": "Quyền quyết định về cơ thể của chính mình là quan trọng — em có quyền từ chối nếu không thoải mái. Tôn trọng giới hạn của bản thân là cách bảo vệ chính mình và dạy người khác cách tôn trọng em. Nếu bị ép buộc, em cần nói với người lớn đáng tin."
  },
  {
    "question": "Nếu có ai đó nhắn tin, gửi hình ảnh không phù hợp cho em, em nên:",
    "options": [
      "Xem thử vì tò mò",
      "Không xem và nói ngay với người lớn đáng tin cậy",
      "Gửi cho bạn bè cùng xem",
      "Xóa đi và giả vờ không có gì"
    ],
    "correct": 1,
    "explanation": "Nội dung không phù hợp có thể gây hại về tinh thần và an toàn; không nên xem hay chia sẻ nó. Thông báo cho người lớn giúp xử lý và bảo vệ em khỏi rủi ro tiếp theo. Giấu kín có thể làm kẻ xấu tiếp tục hành vi."
  },
  {
    "question": "Khi ở nơi công cộng (như nhà vệ sinh, phòng thay đồ), em nên:",
    "options": [
      "Đóng cửa, không để người khác nhìn thấy",
      "Rủ bạn vào cùng",
      "Dùng điện thoại chụp hình",
      "Ở đó càng lâu càng tốt"
    ],
    "correct": 0,
    "explanation": "Giữ quyền riêng tư bằng cách đóng cửa và thay đồ trong không gian riêng giúp bảo vệ bản thân. Không rủ người khác vào nếu đó là nơi riêng tư của từng người, và tuyệt đối không chụp hình. Hành vi tôn trọng quyền riêng tư của bản thân và người khác rất quan trọng."
  },
  {
    "question": "Khi nói chuyện về giới tính, em nên:",
    "options": [
      "Nói bừa với bạn để tỏ ra hiểu biết",
      "Hỏi người lớn, thầy cô hoặc chuyên gia",
      "Tra mạng không kiểm chứng",
      "Né tránh vì xấu hổ"
    ],
    "correct": 1,
    "explanation": "Người lớn đáng tin và chuyên gia cung cấp thông tin chính xác, phù hợp với lứa tuổi; internet không kiểm soát có thể sai lệch. Hỏi một người tin cậy giúp em hiểu đúng, cảm thấy an toàn và chuẩn bị cho thay đổi cơ thể. Tránh nói bừa để không lan truyền thông tin sai."
  },
  {
    "question": "Tôn trọng người khác về giới tính nghĩa là:",
    "options": [
      "Không trêu chọc, không kỳ thị bạn khác giới hoặc bạn có đặc điểm khác mình",
      "Cười khi thấy ai bị chọc ghẹo",
      "Lan truyền tin đồn",
      "Cố tình chọc bạn khác giới"
    ],
    "correct": 0,
    "explanation": "Tôn trọng giới tính giúp xã hội công bằng hơn và bảo vệ quyền lợi của mọi người. Trêu chọc hay kỳ thị gây tổn thương dài lâu và có thể dẫn đến bắt nạt. Học tôn trọng từ nhỏ giúp xây dựng môi trường an toàn và thân thiện."
  },
  {
    "question": "Khi có cảm xúc lạ (thích một bạn khác giới), điều nên làm là:",
    "options": [
      "Bình tĩnh, xem đó là điều bình thường khi lớn lên",
      "Giấu vì xấu hổ",
      "Trêu chọc người đó",
      "Khoe với bạn bè"
    ],
    "correct": 0,
    "explanation": "Thích một bạn khác giới là phản ứng tự nhiên khi phát triển; bình tĩnh giúp em xử lý cảm xúc một cách tôn trọng. Nói chuyện với người lớn nếu cần lời khuyên, và tránh hành vi làm tổn thương người khác. Khoe khoang hay trêu chọc có thể gây rắc rối."
  },
  {
    "question": "Việc giữ gìn vệ sinh cơ thể (thay đồ lót, tắm rửa, rửa tay) có ý nghĩa gì?",
    "options": [
      "Giúp cơ thể sạch sẽ, khỏe mạnh và tự tin",
      "Chỉ để đẹp hơn",
      "Không quan trọng",
      "Là việc của người lớn"
    ],
    "correct": 0,
    "explanation": "Vệ sinh cá nhân phòng tránh bệnh tật, giữ da và cơ thể khỏe mạnh, và giúp em cảm thấy tự tin khi giao tiếp. Đây là thói quen tự quản bản thân quan trọng khi lớn lên. Người lớn có thể hướng dẫn kỹ thuật đúng nhưng việc thực hiện là của em."
  }
];

let currentQuestion = 0;
let score = 0;
let currentQuestionSet = 0; // Track which question set we're on
let totalQuestionSets = Math.ceil(quizData.length / QUESTION_SET_SIZE);

// Function to get current question set questions
function getCurrentQuestionSetQuestions() {
    const startIndex = currentQuestionSet * QUESTION_SET_SIZE;
    const endIndex = Math.min(startIndex + QUESTION_SET_SIZE, quizData.length);
    console.log('Getting questions for set', currentQuestionSet, 'from', startIndex, 'to', endIndex);
    console.log('Total quiz data length:', quizData.length);
    return quizData.slice(startIndex, endIndex);
}

function initQuestionSet() {
    updateQuestionSetDisplay();
    setupQuestionSetEventListeners();
}

// Applause audio with unlock + fallback
let applauseAudio;
let audioUnlocked = false;
let webAudioCtx;
const applauseSources = [
    'assets/sounds/applause.mp3',
    'https://actions.google.com/sounds/v1/crowds/medium_applause.ogg'
];

function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
        if (!applauseAudio) {
            applauseAudio = new Audio();
            applauseAudio.preload = 'auto';
            applauseAudio.crossOrigin = 'anonymous';
            applauseAudio.volume = 0.8;
            // try first working source
            for (const src of applauseSources) {
                const canPlay = applauseAudio.canPlayType(src.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg');
                if (canPlay) { applauseAudio.src = src; break; }
            }
            applauseAudio.load();
        }
        // Prepare Web Audio fallback
        if (!webAudioCtx && window.AudioContext) {
            webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (webAudioCtx.state === 'suspended') {
                webAudioCtx.resume().catch(() => {});
            }
        }
    } catch (_) {}
}

document.addEventListener('click', unlockAudioOnce, { once: true, passive: true });

function playApplause() {
    // Try HTMLAudio first
    if (applauseAudio) {
        applauseAudio.currentTime = 0;
        const p = applauseAudio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => tryNextApplauseSource());
        }
        return;
    }
    // If not yet created (edge), create and try
    try {
        applauseAudio = new Audio();
        applauseAudio.volume = 0.8;
        for (const src of applauseSources) {
            const canPlay = applauseAudio.canPlayType(src.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg');
            if (canPlay) { applauseAudio.src = src; break; }
        }
        applauseAudio.play().catch(() => tryNextApplauseSource());
    } catch (_) {
        playChimeFallback();
    }
}

function tryNextApplauseSource() {
    try {
        if (!applauseAudio) return playChimeFallback();
        const currentIndex = applauseSources.indexOf(applauseAudio.src.replace(location.origin + '/', ''));
        const nextSrc = applauseSources[(currentIndex + 1) % applauseSources.length];
        if (nextSrc && applauseAudio.src !== nextSrc) {
            applauseAudio.src = nextSrc;
            applauseAudio.currentTime = 0;
            applauseAudio.play().catch(() => playChimeFallback());
            return;
        }
    } catch (_) {}
    playChimeFallback();
}

function playChimeFallback() {
    // Simple pleasant chime using Web Audio API as a fallback
    try {
        if (!webAudioCtx && window.AudioContext) {
            webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!webAudioCtx) return;
        const now = webAudioCtx.currentTime;
        const osc = webAudioCtx.createOscillator();
        const gain = webAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.connect(gain).connect(webAudioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } catch (_) {}
}

// Floating smile celebration
function showSmileCelebration() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    const smile = document.createElement('div');
    smile.textContent = '😊';
    smile.style.position = 'absolute';
    smile.style.fontSize = '42px';
    smile.style.left = '50%';
    smile.style.top = '20px';
    smile.style.transform = 'translateX(-50%)';
    smile.style.animation = 'floatUp 1.2s ease-out forwards';
    smile.style.pointerEvents = 'none';
    container.style.position = 'relative';
    container.appendChild(smile);
    setTimeout(() => smile.remove(), 1300);
}

function updateQuestionSetDisplay() {
    const currentQuestionSetQuestions = getCurrentQuestionSetQuestions();
    
    console.log('Current question set:', currentQuestionSet);
    console.log('Current question:', currentQuestion);
    console.log('Questions in set:', currentQuestionSetQuestions);
    
    if (!currentQuestionSetQuestions || currentQuestionSetQuestions.length === 0) {
        console.error('Question set data not available');
        return;
    }
    
    if (currentQuestion >= currentQuestionSetQuestions.length) {
        console.error('Question index out of bounds:', currentQuestion, '>=', currentQuestionSetQuestions.length);
        return;
    }

    const question = currentQuestionSetQuestions[currentQuestion];
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const quizQuestion = document.getElementById('quizQuestion');
    const quizOptions = document.getElementById('quizOptions');

    if (!progressFill || !progressText || !quizQuestion || !quizOptions) {
        console.error('Required quiz elements not found');
        console.error('progressFill:', progressFill);
        console.error('progressText:', progressText);
        console.error('quizQuestion:', quizQuestion);
        console.error('quizOptions:', quizOptions);
        return;
    }

    // Update progress
    const progress = ((currentQuestion + 1) / currentQuestionSetQuestions.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `Bộ câu hỏi ${currentQuestionSet + 1}/${totalQuestionSets} - Câu ${currentQuestion + 1}/${currentQuestionSetQuestions.length}`;

    // Update question
    quizQuestion.innerHTML = `<h4>${question.question}</h4>`;

    // Update options
    quizOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('button');
        optionElement.className = 'quiz-option';
        optionElement.setAttribute('data-answer', String.fromCharCode(65 + index));
        optionElement.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        quizOptions.appendChild(optionElement);
    });

    // Hide feedback
    const quizFeedback = document.getElementById('quizFeedback');
    if (quizFeedback) {
        quizFeedback.style.display = 'none';
    }
}

function setupQuestionSetEventListeners() {
    const quizOptions = document.getElementById('quizOptions');
    const quizFeedback = document.getElementById('quizFeedback');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');

    if (!quizOptions || !quizFeedback || !nextQuestionBtn) return;

    quizOptions.addEventListener('click', (e) => {
        if (e.target.closest('.quiz-option')) {
            const selectedOption = e.target.closest('.quiz-option');
            const selectedAnswer = selectedOption.getAttribute('data-answer');
            const correctAnswer = String.fromCharCode(65 + quizData[currentQuestion].correct);
            
            // Debug logging
            console.log('Question:', quizData[currentQuestion].question);
            console.log('Correct index:', quizData[currentQuestion].correct);
            console.log('Correct answer:', correctAnswer);
            console.log('Selected answer:', selectedAnswer);
            
            // Disable all options
            document.querySelectorAll('.quiz-option').forEach(option => {
                option.disabled = true;
                if (option.getAttribute('data-answer') === correctAnswer) {
                    option.classList.add('correct');
                } else if (option.getAttribute('data-answer') === selectedAnswer && selectedAnswer !== correctAnswer) {
                    option.classList.add('incorrect');
                }
            });

            // Show feedback
            const feedbackContent = quizFeedback.querySelector('.feedback-content');
            if (selectedAnswer === correctAnswer) {
                score++;
                feedbackContent.innerHTML = `
                    <div class="feedback-icon">🎉</div>
                    <h4>Tuyệt vời! Bạn đã trả lời chính xác</h4>
                    <p>${quizData[currentQuestion].explanation}</p>
                `;

                // Play applause sound and show smile animation
                try { playApplause(); } catch(e) {}
                showSmileCelebration();
            } else {
                feedbackContent.innerHTML = `
                    <div class="feedback-icon">💡</div>
                    <h4>Bạn đã cố gắng rồi, mình thử suy nghĩ thêm chút nữa nhé!</h4>
                    <p>${quizData[currentQuestion].explanation}</p>
                `;
            }
            
            quizFeedback.style.display = 'block';
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestion++;
        const currentQuestionSetQuestions = getCurrentQuestionSetQuestions();
        
        if (currentQuestion < currentQuestionSetQuestions.length) {
            updateQuestionSetDisplay();
        } else {
            // Question set completed, show results
            showQuestionSetResults();
        }
    });
}

        function showQuestionSetResults() {
            const quizContainer = document.getElementById('quizContainer');
            const currentQuestionSetQuestions = getCurrentQuestionSetQuestions();
            const percentage = Math.round((score / currentQuestionSetQuestions.length) * 100);
            
            // Save question set results to localStorage
            userProgress.completeQuestionSet(currentQuestionSet, percentage);
            
            quizContainer.innerHTML = `
                <div class="quiz-results">
                    <div class="results-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h3>Kết quả Bộ câu hỏi ${currentQuestionSet + 1}/${totalQuestionSets}</h3>
                    <div class="score-display">
                        <span class="score-number">${score}/${currentQuestionSetQuestions.length}</span>
                        <span class="score-percentage">${percentage}%</span>
                    </div>
                    <p class="score-message">
                        ${percentage >= 80 ? 'Xuất sắc! Bạn hiểu rất tốt về cảm xúc!' : 
                          percentage >= 60 ? 'Tốt! Hãy tiếp tục học hỏi thêm!' : 
                          'Hãy thử lại để cải thiện kết quả!'}
                    </p>
                    <div class="points-earned">
                        <i class="fas fa-star"></i>
                        <span>+${Math.round(percentage * 20)} điểm</span>
                    </div>
                    <div class="quiz-actions">
                        <button class="restart-quiz-btn" id="backToSelectionBtn">Chọn bộ câu hỏi khác</button>
                        <button class="restart-quiz-btn" id="restartQuizBtn">Làm lại</button>
                    </div>
                </div>
            `;
            
            // Add event listeners for buttons
            const backToSelectionBtn = document.getElementById('backToSelectionBtn');
            if (backToSelectionBtn) {
                backToSelectionBtn.addEventListener('click', backToSelection);
            }
            
            const restartBtn = document.getElementById('restartQuizBtn');
            if (restartBtn) {
                restartBtn.addEventListener('click', restartQuestionSet);
            }
        }

function nextQuestionSet() {
    currentQuestionSet++;
    currentQuestion = 0;
    score = 0;
    
    // Reset quiz container to original state
    const quizContainer = document.getElementById('quizContainer');
    quizContainer.innerHTML = `
        <div class="quiz-card active" id="quizCard">
            <div class="quiz-header">
                <button class="back-to-start-btn" id="backToStartBtn">
                    <i class="fas fa-arrow-left"></i>
                    Chọn bộ câu hỏi khác
                </button>
            </div>
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <span class="progress-text" id="progressText">Quiz ${currentQuiz + 1}/5 - Câu 1/10</span>
            </div>
            
            <div class="quiz-question" id="quizQuestion">
                <h4>Đang tải câu hỏi...</h4>
            </div>
            
            <div class="quiz-options" id="quizOptions">
                <button class="quiz-option" data-answer="A">
                    <span class="option-letter">A</span>
                    <span class="option-text">Đang tải...</span>
                </button>
                <button class="quiz-option" data-answer="B">
                    <span class="option-letter">B</span>
                    <span class="option-text">Đang tải...</span>
                </button>
                <button class="quiz-option" data-answer="C">
                    <span class="option-letter">C</span>
                    <span class="option-text">Đang tải...</span>
                </button>
                <button class="quiz-option" data-answer="D">
                    <span class="option-letter">D</span>
                    <span class="option-text">Đang tải...</span>
                </button>
            </div>
            
            <div class="quiz-feedback" id="quizFeedback" style="display: none;">
                <div class="feedback-content">
                    <div class="feedback-icon">🎉</div>
                    <h4>Tuyệt vời! Bạn đã trả lời chính xác</h4>
                    <p>Bạn đã hiểu rất tốt về cách xử lý cảm xúc. Hãy tiếp tục!</p>
                </div>
                <button class="next-question-btn" id="nextQuestionBtn">Câu tiếp theo</button>
            </div>
        </div>
    `;
    
    // Add back to start button event listener
    const backBtn = document.getElementById('backToStartBtn');
    if (backBtn) {
        backBtn.addEventListener('click', backToSelection);
    }
    
    // Update quiz display and setup event listeners
    updateQuizDisplay();
    setupQuizEventListeners();
}

function completeAllQuestionSets() {
    // Show completion message
    const quizContainer = document.getElementById('quizContainer');
    quizContainer.innerHTML = `
        <div class="quiz-completion">
            <div class="completion-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <h3>🎉 Chúc mừng!</h3>
            <p>Bạn đã hoàn thành tất cả ${totalQuestionSets} bộ câu hỏi!</p>
            <p>Bạn đã đạt được huy hiệu <strong>Chuyên gia Câu hỏi</strong>!</p>
            <button class="restart-all-btn" id="restartAllBtn">Bắt đầu lại từ đầu</button>
        </div>
    `;
    
    const restartAllBtn = document.getElementById('restartAllBtn');
    if (restartAllBtn) {
        restartAllBtn.addEventListener('click', () => {
            currentQuestionSet = 0;
            currentQuestion = 0;
            score = 0;
            updateQuestionSetDisplay();
            setupQuestionSetEventListeners();
        });
    }
}

function backToSelection() {
    // Show quiz selection
    const quizSelection = document.querySelector('.quiz-selection');
    const quizContainer = document.getElementById('quizContainer');
	
    if (quizSelection) {
        quizSelection.style.display = 'block';
    }
	
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }
	    
    // Update UI to reflect current state
    userProgress.updateUI();
}

function restartQuestionSet() {
    currentQuestion = 0;
    score = 0;
    
    // Reset quiz container to original state
    const quizContainer = document.getElementById('quizContainer');
    quizContainer.innerHTML = `
        <div class="quiz-card active" id="quizCard">
            <div class="quiz-header">
                <button class="back-to-start-btn" id="backToStartBtn">
                    <i class="fas fa-arrow-left"></i>
                    Chọn bộ câu hỏi khác
                </button>
            </div>
            <div class="quiz-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <span class="progress-text" id="progressText">Quiz 1/5 - Câu 1/10</span>
            </div>
            
            <div class="quiz-question" id="quizQuestion">
                <h4>Khi bạn cảm thấy buồn, bạn thường làm gì?</h4>
            </div>
            
            <div class="quiz-options" id="quizOptions">
                <button class="quiz-option" data-answer="A">
                    <span class="option-letter">A</span>
                    <span class="option-text">Khóc và chia sẻ với người thân</span>
                </button>
                <button class="quiz-option" data-answer="B">
                    <span class="option-letter">B</span>
                    <span class="option-text">Nghe nhạc buồn và ở một mình</span>
                </button>
                <button class="quiz-option" data-answer="C">
                    <span class="option-letter">C</span>
                    <span class="option-text">Tìm cách làm việc khác để quên đi</span>
                </button>
                <button class="quiz-option" data-answer="D">
                    <span class="option-letter">D</span>
                    <span class="option-text">Vẽ tranh hoặc viết nhật ký</span>
                </button>
            </div>
            
            <div class="quiz-feedback" id="quizFeedback" style="display: none;">
                <div class="feedback-content">
                    <div class="feedback-icon">🎉</div>
                    <h4>Tuyệt vời! Bạn đã trả lời chính xác</h4>
                    <p>Bạn đã hiểu rất tốt về cách xử lý cảm xúc. Hãy tiếp tục!</p>
                </div>
                <button class="next-question-btn" id="nextQuestionBtn">Câu tiếp theo</button>
            </div>
        </div>
    `;
    
    // Add back to start button event listener
    const backBtn = document.getElementById('backToStartBtn');
    if (backBtn) {
        backBtn.addEventListener('click', backToSelection);
    }
    
    // Re-initialize quiz
    updateQuizDisplay();
    setupQuizEventListeners();
}

// Story System
function initStories() {
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach(card => {
        card.addEventListener('click', () => {
            const storyId = card.getAttribute('data-story');
            openStory(storyId);
        });
    });
}

        function openStory(storyId) {
            if (!storyId) {
                console.error('Story ID is required');
                return;
            }
            
            // Save story read to localStorage
            userProgress.readStory(storyId);
            
            const stories = {
                '1': {
                    title: 'Chú Gấu và Cảm xúc',
                    content: `
                        <div class="story-content-full">
                            <h3>Chú Gấu và Cảm xúc</h3>
                            <div class="story-text">
                                <p>Ngày xửa ngày xưa, có một chú gấu tên là Boo sống trong rừng xanh. Boo rất hay thay đổi cảm xúc - khi thì vui vẻ nhảy nhót, khi thì buồn bã ngồi một góc.</p>
                                
                                <p>Một ngày nọ, Boo cảm thấy rất tức giận vì không tìm được mật ong. Chú gấu đã đập phá tổ ong và làm tổn thương những chú ong nhỏ. Những chú ong bay đi hết, và Boo càng tức giận hơn.</p>
                                
                                <p>Bà gấu già thông thái đã dạy Boo: "Con ơi, cảm xúc là điều tự nhiên, nhưng con cần học cách quản lý chúng. Khi tức giận, hãy hít thở sâu và nghĩ về hậu quả trước khi hành động."</p>
                                
                                <p>Boo học được cách hít thở sâu, đếm từ 1 đến 10, và nghĩ về những điều tốt đẹp. Chú gấu cũng học cách chia sẻ cảm xúc với bạn bè thay vì giữ trong lòng.</p>
                                
                                <p>Một ngày khác, Boo cảm thấy buồn vì mất bạn. Thay vì khóc một mình, chú gấu đã tìm đến bà gấu già để chia sẻ. Bà gấu đã dạy Boo rằng: "Buồn là cảm xúc bình thường, nhưng con không nên để nó kéo dài quá lâu. Hãy tìm những hoạt động vui vẻ để làm."</p>
                                
                                <p>Boo bắt đầu vẽ tranh, chơi với bạn bè, và giúp đỡ những con vật khác trong rừng. Chú gấu nhận ra rằng khi giúp đỡ người khác, mình cũng cảm thấy vui vẻ hơn.</p>
                                
                                <p>Từ đó, Boo học được cách kiểm soát cảm xúc và trở thành một chú gấu tốt bụng, được mọi người yêu quý. Chú gấu cũng dạy lại những bài học này cho các bạn nhỏ khác trong rừng.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Cảm xúc là bình thường, nhưng chúng ta cần học cách quản lý chúng một cách tích cực. Hãy chia sẻ cảm xúc với người thân và tìm những hoạt động vui vẻ để làm khi buồn.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                },
                '2': {
                    title: 'Bạn bè và Sự chia sẻ',
                    content: `
                        <div class="story-content-full">
                            <h3>Bạn bè và Sự chia sẻ</h3>
                            <div class="story-text">
                                <p>Minh và Lan là hai người bạn thân từ nhỏ. Họ luôn chơi cùng nhau, học cùng nhau, và chia sẻ mọi thứ với nhau.</p>
                                
                                <p>Một ngày, Lan cảm thấy rất buồn vì bị điểm kém trong bài kiểm tra toán. Lan sợ bố mẹ sẽ thất vọng và bạn bè sẽ cười chê. Cô bé đã khóc một mình trong phòng.</p>
                                
                                <p>Minh đến nhà Lan và thấy bạn đang buồn. Thay vì hỏi ngay, Minh đã ngồi bên cạnh Lan và hỏi: "Bạn có muốn chia sẻ với mình không? Mình sẽ lắng nghe."</p>
                                
                                <p>Lan đã kể cho Minh nghe về nỗi buồn của mình. Minh không chỉ lắng nghe mà còn động viên: "Điểm kém không có nghĩa là bạn kém thông minh. Có thể bạn chỉ cần học cách khác thôi. Mình sẽ giúp bạn học toán nhé!"</p>
                                
                                <p>Từ đó, Minh và Lan học cùng nhau mỗi ngày. Minh dạy Lan cách giải toán dễ hiểu hơn, và Lan cũng giúp Minh học tiếng Anh. Cả hai đều tiến bộ rất nhiều.</p>
                                
                                <p>Một lần khác, Minh cảm thấy lo lắng vì sắp thi học kỳ. Lan đã an ủi: "Bạn đã học rất chăm chỉ rồi, mình tin bạn sẽ làm tốt. Nếu bạn lo lắng, hãy hít thở sâu và nghĩ về những điều tích cực."</p>
                                
                                <p>Nhờ sự chia sẻ và hỗ trợ lẫn nhau, cả hai đã vượt qua nhiều khó khăn và trở nên thân thiết hơn. Họ học được rằng tình bạn thật sự là khi có thể chia sẻ cả niềm vui và nỗi buồn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chia sẻ cảm xúc với bạn bè không chỉ giúp chúng ta cảm thấy tốt hơn mà còn làm tình bạn thêm gắn bó. Hãy lắng nghe và hỗ trợ bạn bè khi họ cần.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                },
                '3': {
                    title: 'Vượt qua Nỗi sợ',
                    content: `
                        <div class="story-content-full">
                            <h3>Vượt qua Nỗi sợ</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé rất sợ bóng tối. Mỗi khi trời tối, cô bé thường khóc và gọi mẹ. Hoa sợ rằng trong bóng tối có những con quái vật đang ẩn nấp.</p>
                                
                                <p>Một ngày, mẹ đã dạy Hoa cách đối mặt với nỗi sợ: "Con ơi, sợ hãi là cảm xúc bình thường. Nhưng thay vì trốn tránh, con hãy thử hiểu nỗi sợ của mình. Bóng tối không có gì đáng sợ cả, nó chỉ là không có ánh sáng thôi."</p>
                                
                                <p>Mẹ đã dạy Hoa cách thở sâu và đếm từ 1 đến 10 khi cảm thấy sợ. Mẹ cũng dạy Hoa tưởng tượng về những điều tích cực, như những ngôi sao lấp lánh trên bầu trời đêm.</p>
                                
                                <p>Hoa bắt đầu thử ngủ một mình với đèn ngủ nhỏ. Cô bé học cách thở sâu và nghĩ về những điều vui vẻ. Dần dần, Hoa nhận ra rằng bóng tối không đáng sợ như cô bé nghĩ.</p>
                                
                                <p>Một đêm, Hoa nghe thấy tiếng động trong phòng. Thay vì sợ hãi, cô bé đã thở sâu và kiểm tra xem đó là gì. Hóa ra đó chỉ là tiếng gió thổi qua cửa sổ. Hoa cảm thấy rất tự hào vì đã vượt qua nỗi sợ.</p>
                                
                                <p>Từ đó, Hoa không còn sợ bóng tối nữa. Cô bé thậm chí còn thích ngắm sao vào ban đêm. Hoa học được rằng khi chúng ta đối mặt với nỗi sợ, chúng ta sẽ trở nên mạnh mẽ hơn.</p>
                                
                                <p>Hoa cũng dạy lại những bài học này cho em trai của mình khi em cũng sợ bóng tối. Cô bé trở thành một người chị gái dũng cảm và tự tin.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chúng ta có thể học cách đối mặt và vượt qua những nỗi sợ hãi bằng cách hiểu và chấp nhận chúng. Hãy thở sâu và nghĩ về những điều tích cực khi cảm thấy sợ.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                },
                '4': {
                    title: 'Làm việc nhóm',
                    content: `
                        <div class="story-content-full">
                            <h3>Làm việc nhóm</h3>
                            <div class="story-text">
                                <p>Minh, Lan và Hoa được cô giáo giao nhiệm vụ làm một dự án về môi trường. Ban đầu, cả ba đều muốn làm theo ý kiến của mình và không chịu lắng nghe nhau.</p>
                                
                                <p>Minh muốn làm poster về rừng, Lan muốn làm video về biển, còn Hoa muốn làm mô hình về thành phố xanh. Cả ba đều cãi nhau và không ai chịu nhường ai.</p>
                                
                                <p>Cô giáo đã dạy các bạn: "Làm việc nhóm không có nghĩa là ai cũng phải làm giống nhau. Mỗi người có thể đóng góp ý tưởng riêng, nhưng cần biết lắng nghe và hợp tác với nhau."</p>
                                
                                <p>Từ đó, ba bạn đã học cách chia sẻ ý tưởng và lắng nghe nhau. Minh vẽ poster rừng, Lan quay video biển, còn Hoa làm mô hình thành phố. Kết quả là một dự án hoàn chỉnh về môi trường.</p>
                                
                                <p>Khi trình bày trước lớp, cả ba đều tự hào về thành quả chung. Họ nhận ra rằng khi hợp tác, mọi việc sẽ dễ dàng và thú vị hơn nhiều.</p>
                                
                                <p>Từ đó, ba bạn trở thành nhóm bạn thân và thường xuyên làm việc cùng nhau. Họ học được rằng tình bạn và sự hợp tác là chìa khóa của thành công.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Làm việc nhóm giúp chúng ta học hỏi từ nhau và đạt được kết quả tốt hơn. Hãy lắng nghe, chia sẻ và hợp tác với bạn bè.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                },
                '5': {
                    title: 'Sáng tạo và Tưởng tượng',
                    content: `
                        <div class="story-content-full">
                            <h3>Sáng tạo và Tưởng tượng</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé rất thích vẽ và tưởng tượng. Cậu thường vẽ những con vật kỳ lạ và những thành phố trong mơ. Nhưng một số bạn bè cười chê và nói rằng những gì Nam vẽ không có thật.</p>
                                
                                <p>Nam cảm thấy buồn và bắt đầu vẽ theo những gì người khác muốn. Cậu vẽ những bức tranh đơn giản và nhàm chán, không còn sáng tạo nữa.</p>
                                
                                <p>Cô giáo mỹ thuật đã khuyến khích Nam: "Sáng tạo là điều tuyệt vời nhất mà con người có. Đừng để ai đó làm mất đi trí tưởng tượng của em. Hãy vẽ những gì em muốn, những gì em mơ ước."</p>
                                
                                <p>Nam bắt đầu vẽ lại những gì cậu thích. Cậu vẽ những con rồng bay lượn, những thành phố dưới nước, và những hành tinh xa xôi. Mỗi bức tranh đều chứa đựng những câu chuyện thú vị.</p>
                                
                                <p>Dần dần, các bạn bè cũng bắt đầu thích thú với những bức tranh của Nam. Họ xin Nam dạy cách vẽ và cùng nhau tạo ra những tác phẩm tuyệt đẹp.</p>
                                
                                <p>Nam học được rằng sáng tạo và trí tưởng tượng là món quà quý giá. Khi chúng ta dám mơ ước và sáng tạo, chúng ta có thể tạo ra những điều kỳ diệu.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Sáng tạo và trí tưởng tượng giúp chúng ta phát triển tài năng và tạo ra những điều tuyệt vời. Hãy dám mơ ước và sáng tạo theo cách riêng của mình.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                },
                '6': {
                    title: 'Trách nhiệm và Tự lập',
                    content: `
                        <div class="story-content-full">
                            <h3>Trách nhiệm và Tự lập</h3>
                            <div class="story-text">
                                <p>Minh là một cậu bé 8 tuổi, luôn được bố mẹ chăm sóc từng li từng tí. Cậu không biết tự mặc quần áo, không biết dọn dẹp phòng, và luôn nhờ người khác giúp đỡ.</p>
                                
                                <p>Một ngày, bố mẹ Minh phải đi công tác xa và để Minh ở nhà với bà ngoại. Bà ngoại đã dạy Minh: "Con đã lớn rồi, cần học cách tự chăm sóc bản thân. Đây là trách nhiệm của con."</p>
                                
                                <p>Minh bắt đầu học cách tự mặc quần áo, tự dọn dẹp phòng, và tự chuẩn bị đồ dùng học tập. Ban đầu rất khó khăn, nhưng dần dần cậu đã quen.</p>
                                
                                <p>Khi bố mẹ trở về, họ rất ngạc nhiên khi thấy Minh đã biết tự lập. Cậu tự dọn dẹp phòng, tự chuẩn bị đồ đi học, và thậm chí còn giúp bố mẹ làm việc nhà.</p>
                                
                                <p>Minh cảm thấy rất tự hào về bản thân. Cậu nhận ra rằng khi tự lập, mình sẽ mạnh mẽ và tự tin hơn. Cậu cũng hiểu rằng có trách nhiệm với bản thân là điều quan trọng.</p>
                                
                                <p>Từ đó, Minh luôn cố gắng tự làm những việc trong khả năng của mình. Cậu trở thành một cậu bé tự lập và có trách nhiệm, được mọi người yêu quý.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Tự lập và có trách nhiệm giúp chúng ta trở nên mạnh mẽ và tự tin. Hãy học cách tự chăm sóc bản thân và có trách nhiệm với những việc mình làm.</p>
                            </div>
                            <div class="story-reward">
                                <i class="fas fa-star"></i>
                                <span>+50 điểm</span>
                            </div>
                        </div>
                    `
                }
            };

            const story = stories[storyId];
            if (story) {
                showStoryModal(story.title, story.content);
            } else {
                console.error(`Story with ID ${storyId} not found`);
                alert('Câu chuyện không tìm thấy. Vui lòng thử lại!');
            }
        }

function showStoryModal(title, content) {
    if (!title || !content) {
        console.error('Title and content are required for story modal');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'story-modal-overlay';
    modal.innerHTML = `
        <div class="story-modal">
            <div class="story-modal-header">
                <h3>${title}</h3>
                <button class="close-story-btn">&times;</button>
            </div>
            <div class="story-modal-body">
                ${content}
            </div>
            <div class="story-modal-footer">
                <button class="close-story-btn">Đóng</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelectorAll('.close-story-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Kham Pha page...');
    
    // Load real data from localStorage
    userProgress.updateUI();
    
    // Initialize interactive features
    initStories();
    initQuestionSetStart();
    initTopics();
    initTopicCards();
    
    console.log('Kham Pha page initialized successfully!');
    console.log('Quiz selection cards found:', document.querySelectorAll('.quiz-selection-card .start-quiz-btn').length);
});

// Initialize question set start functionality
function initQuestionSetStart() {
    // Handle quiz selection buttons
    const quizSelectionCards = document.querySelectorAll('.quiz-selection-card .start-quiz-btn');
    const quizContainer = document.getElementById('quizContainer');
    const quizSelection = document.querySelector('.quiz-selection');
    
    console.log('initQuestionSetStart called');
    console.log('Found quiz selection cards:', quizSelectionCards.length);
    console.log('Quiz container found:', !!quizContainer);
    console.log('Quiz selection found:', !!quizSelection);
    
    // Direct binding for existing buttons
    quizSelectionCards.forEach(button => {
        button.addEventListener('click', () => handleStartQuiz(button));
    });

    // Delegated binding as fallback (in case buttons are re-rendered)
    document.addEventListener('click', (e) => {
        // Click on button
        let targetBtn = e.target.closest('.quiz-selection-card .start-quiz-btn');
        // Or click anywhere on the card
        const targetCard = e.target.closest('.quiz-selection-card');
        if (!targetBtn && targetCard) {
            targetBtn = targetCard.querySelector('.start-quiz-btn');
        }
        if (!targetBtn) return;
        handleStartQuiz(targetBtn);
    });

    function handleStartQuiz(buttonEl) {
        const quizIndex = parseInt(buttonEl.getAttribute('data-quiz'));
        console.log('Quiz button clicked, index:', quizIndex);
        
        // Set current question set
        currentQuestionSet = isNaN(quizIndex) ? 0 : quizIndex;
        currentQuestion = 0;
        score = 0;
        
        console.log('Set currentQuestionSet to:', currentQuestionSet);
        console.log('Reset currentQuestion to:', currentQuestion);
        
        // Highlight selected card
        document.querySelectorAll('.quiz-selection-card').forEach(card => card.classList.remove('selected'));
        const card = buttonEl.closest('.quiz-selection-card');
        if (card) card.classList.add('selected');
        
        // Ensure quiz selection stays visible (do NOT hide)
        if (quizSelection) {
            quizSelection.style.removeProperty('display');
        }
        
        // Show quiz container below selection
        if (quizContainer) {
            quizContainer.style.removeProperty('display');
            quizContainer.style.display = 'block';
            // Smooth scroll to the question block
            setTimeout(() => {
                quizContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
            console.log('Shown quiz container below selection');
        }
        
        // Initialize question set
        console.log('Initializing question set...');
        initQuestionSet();
    }
}

// Topic Cards System
function initTopicCards() {
    const topicCards = document.querySelectorAll('.topic-card');
    const topicCardsGrid = document.getElementById('topicCardsGrid');
    const storiesList = document.getElementById('storiesList');
    const backToTopicsBtn = document.getElementById('backToTopicsBtn');
    
    // Topic data mapping
    const topicData = {
        'quan-ly-cam-xuc': {
            title: 'Quản lý cảm xúc',
            stories: [
                {
                    id: '1',
                    title: 'Chú Gấu và Cảm xúc',
                    description: 'Một câu chuyện về cách chú gấu học cách quản lý cảm xúc của mình',
                    content: `
                        <div class="story-content-full">
                            <h3>Chú Gấu và Cảm xúc</h3>
                            <div class="story-text">
                                <p>Ngày xửa ngày xưa, có một chú gấu tên là Boo sống trong rừng xanh. Boo rất hay thay đổi cảm xúc - khi thì vui vẻ nhảy nhót, khi thì buồn bã ngồi một góc.</p>
                                
                                <p>Một ngày nọ, Boo cảm thấy rất tức giận vì không tìm được mật ong. Chú gấu đã đập phá tổ ong và làm tổn thương những chú ong nhỏ. Những chú ong bay đi hết, và Boo càng tức giận hơn.</p>
                                
                                <p>Bà gấu già thông thái đã dạy Boo: "Con ơi, cảm xúc là điều tự nhiên, nhưng con cần học cách quản lý chúng. Khi tức giận, hãy hít thở sâu và nghĩ về hậu quả trước khi hành động."</p>
                                
                                <p>Boo học được cách hít thở sâu, đếm từ 1 đến 10, và nghĩ về những điều tốt đẹp. Chú gấu cũng học cách chia sẻ cảm xúc với bạn bè thay vì giữ trong lòng.</p>
                                
                                <p>Một ngày khác, Boo cảm thấy buồn vì mất bạn. Thay vì khóc một mình, chú gấu đã tìm đến bà gấu già để chia sẻ. Bà gấu đã dạy Boo rằng: "Buồn là cảm xúc bình thường, nhưng con không nên để nó kéo dài quá lâu. Hãy tìm những hoạt động vui vẻ để làm."</p>
                                
                                <p>Boo bắt đầu vẽ tranh, chơi với bạn bè, và giúp đỡ những con vật khác trong rừng. Chú gấu nhận ra rằng khi giúp đỡ người khác, mình cũng cảm thấy vui vẻ hơn.</p>
                                
                                <p>Từ đó, Boo học được cách kiểm soát cảm xúc và trở thành một chú gấu tốt bụng, được mọi người yêu quý. Chú gấu cũng dạy lại những bài học này cho các bạn nhỏ khác trong rừng.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Cảm xúc là bình thường, nhưng chúng ta cần học cách quản lý chúng một cách tích cực. Hãy chia sẻ cảm xúc với người thân và tìm những hoạt động vui vẻ để làm khi buồn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '6',
                    title: 'Cô Bé và Cơn Giận',
                    description: 'Học cách kiểm soát cơn giận và tìm cách giải tỏa cảm xúc tích cực',
                    content: `
                        <div class="story-content-full">
                            <h3>Cô Bé và Cơn Giận</h3>
                            <div class="story-text">
                                <p>Minh là một cô bé 9 tuổi rất hay nóng giận. Mỗi khi có chuyện không vừa ý, cô bé thường la hét, đập phá đồ đạc và khóc lóc rất lâu.</p>
                                
                                <p>Một ngày, Minh bị điểm kém môn toán và cảm thấy rất tức giận. Cô bé đã ném sách vở khắp phòng và la hét: "Tại sao mình lại kém thế này! Mình ghét toán!"</p>
                                
                                <p>Mẹ Minh đã ngồi xuống bên cạnh và nói: "Con ơi, mẹ hiểu con đang tức giận. Nhưng việc la hét và đập phá không giúp con cảm thấy tốt hơn. Hãy thử cách khác nhé."</p>
                                
                                <p>Mẹ đã dạy Minh cách "Hộp Cảm xúc": "Khi con cảm thấy tức giận, hãy viết hoặc vẽ những gì con đang cảm thấy vào một tờ giấy, sau đó bỏ vào hộp này. Điều này sẽ giúp con giải tỏa cảm xúc."</p>
                                
                                <p>Minh bắt đầu thử cách này. Mỗi khi tức giận, cô bé viết ra những gì mình cảm thấy và bỏ vào hộp. Dần dần, cô bé nhận ra rằng việc viết ra giúp mình bình tĩnh hơn.</p>
                                
                                <p>Một lần, Minh tức giận vì bạn bè không chơi với mình. Thay vì la hét, cô bé đã viết: "Mình cảm thấy buồn và tức giận vì các bạn không chơi với mình. Mình muốn được chơi cùng."</p>
                                
                                <p>Sau khi viết xong, Minh cảm thấy nhẹ nhõm hơn và có thể suy nghĩ rõ ràng hơn. Cô bé đã đến nói chuyện với các bạn một cách bình tĩnh và cuối cùng được chơi cùng.</p>
                                
                                <p>Từ đó, Minh học được cách kiểm soát cơn giận và trở thành một cô bé bình tĩnh, được mọi người yêu quý hơn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Khi tức giận, hãy tìm cách giải tỏa cảm xúc một cách tích cực như viết, vẽ, hoặc hít thở sâu. Điều này giúp chúng ta bình tĩnh và suy nghĩ rõ ràng hơn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '7',
                    title: 'Chú Thỏ và Nỗi Lo',
                    description: 'Học cách đối phó với lo lắng và tìm sự bình yên trong tâm hồn',
                    content: `
                        <div class="story-content-full">
                            <h3>Chú Thỏ và Nỗi Lo</h3>
                            <div class="story-text">
                                <p>Thỏ Con là một chú thỏ nhỏ rất hay lo lắng. Chú lo lắng về mọi thứ: lo trời mưa, lo không có cà rốt ăn, lo bạn bè không thích mình, lo không học được bài mới.</p>
                                
                                <p>Một ngày, Thỏ Con lo lắng quá mức đến nỗi không thể ngủ được. Chú cứ nghĩ mãi về những điều có thể xảy ra ngày mai và cảm thấy rất mệt mỏi.</p>
                                
                                <p>Bà Thỏ già thông thái đã dạy Thỏ Con: "Con ơi, lo lắng là cảm xúc bình thường, nhưng khi con lo lắng quá nhiều, nó sẽ làm con mệt mỏi. Hãy học cách kiểm soát nó."</p>
                                
                                <p>Bà Thỏ đã dạy Thỏ Con bài tập "Thở bụng": "Hãy đặt tay lên bụng, hít vào từ từ và cảm nhận bụng phình ra. Sau đó thở ra từ từ và cảm nhận bụng xẹp xuống. Làm như vậy 5 lần."</p>
                                
                                <p>Thỏ Con bắt đầu thực hành bài tập này mỗi khi cảm thấy lo lắng. Chú nhận ra rằng việc thở sâu giúp mình bình tĩnh hơn và có thể suy nghĩ rõ ràng hơn.</p>
                                
                                <p>Bà Thỏ cũng dạy Thỏ Con cách "Chia nhỏ vấn đề": "Khi con lo lắng về một việc lớn, hãy chia nó thành những việc nhỏ hơn và giải quyết từng việc một."</p>
                                
                                <p>Một lần, Thỏ Con lo lắng về kỳ thi sắp tới. Thay vì lo lắng về toàn bộ kỳ thi, chú đã chia nhỏ: "Hôm nay mình sẽ ôn bài toán, ngày mai ôn bài văn, ngày kia ôn bài khoa học."</p>
                                
                                <p>Dần dần, Thỏ Con học được cách kiểm soát lo lắng và trở thành một chú thỏ tự tin, vui vẻ hơn rất nhiều.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Khi lo lắng, hãy thở sâu và chia nhỏ vấn đề để giải quyết. Điều này giúp chúng ta bình tĩnh và có thể xử lý mọi việc một cách hiệu quả.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '8',
                    title: 'Cậu Bé và Niềm Vui',
                    description: 'Học cách tìm niềm vui trong những điều nhỏ bé và lan tỏa hạnh phúc',
                    content: `
                        <div class="story-content-full">
                            <h3>Cậu Bé và Niềm Vui</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé 8 tuổi rất hay buồn bã. Cậu thường cảm thấy không có gì vui vẻ và luôn nhìn mọi thứ một cách tiêu cực.</p>
                                
                                <p>Một ngày, cô giáo đã dạy Nam về "Lọ Niềm Vui": "Mỗi ngày, hãy viết ra một điều làm con vui vẻ và bỏ vào lọ này. Cuối tuần, con sẽ đọc lại và cảm thấy hạnh phúc."</p>
                                
                                <p>Ban đầu, Nam cảm thấy khó khăn vì không tìm thấy gì vui vẻ. Nhưng cô giáo đã gợi ý: "Có thể là một bông hoa đẹp con nhìn thấy, một món ăn ngon, hoặc một lời khen của ai đó."</p>
                                
                                <p>Ngày đầu tiên, Nam viết: "Hôm nay mẹ nấu món canh chua mà con thích." Ngày thứ hai: "Bạn Lan cho con mượn bút chì màu." Ngày thứ ba: "Con thấy một chú mèo con dễ thương."</p>
                                
                                <p>Dần dần, Nam bắt đầu chú ý đến những điều tích cực xung quanh mình. Cậu nhận ra rằng có rất nhiều điều nhỏ bé nhưng đáng yêu trong cuộc sống.</p>
                                
                                <p>Một ngày, Nam thấy bạn Minh buồn vì bị điểm kém. Thay vì bỏ qua, cậu đã đến an ủi: "Đừng buồn, lần sau mình sẽ giúp bạn học bài nhé." Minh cảm thấy rất vui vì được bạn quan tâm.</p>
                                
                                <p>Nam nhận ra rằng khi giúp đỡ người khác, mình cũng cảm thấy vui vẻ hơn. Cậu bắt đầu chủ động giúp đỡ bạn bè và lan tỏa niềm vui cho mọi người.</p>
                                
                                <p>Cuối tuần, khi đọc lại những điều vui vẻ trong lọ, Nam cảm thấy rất hạnh phúc. Cậu hiểu rằng hạnh phúc không phải là những điều lớn lao mà là những khoảnh khắc nhỏ bé, ý nghĩa trong cuộc sống.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Hãy chú ý đến những điều tích cực và nhỏ bé xung quanh mình. Khi chúng ta lan tỏa niềm vui cho người khác, chúng ta cũng sẽ cảm thấy hạnh phúc hơn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '9',
                    title: 'Cô Gái và Sự Tự Tin',
                    description: 'Học cách xây dựng lòng tự tin và đối mặt với nỗi sợ hãi',
                    content: `
                        <div class="story-content-full">
                            <h3>Cô Gái và Sự Tự Tin</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé 10 tuổi rất nhút nhát và thiếu tự tin. Cô bé luôn sợ phát biểu trước lớp, sợ tham gia các hoạt động tập thể, và luôn nghĩ rằng mình không giỏi bằng các bạn khác.</p>
                                
                                <p>Một ngày, cô giáo gọi Hoa lên bảng giải bài toán. Hoa run rẩy và không dám nhìn lên. Cô bé nói nhỏ: "Em... em không biết làm."</p>
                                
                                <p>Cô giáo đã ngồi xuống bên cạnh Hoa và nói: "Con ơi, cô tin con có thể làm được. Hãy thử từng bước một, cô sẽ giúp con."</p>
                                
                                <p>Cô giáo đã dạy Hoa cách "Thở tự tin": "Trước khi làm bất cứ việc gì, hãy hít thở sâu và nói với bản thân: 'Mình có thể làm được!'"</p>
                                
                                <p>Hoa bắt đầu thực hành cách này. Mỗi khi cảm thấy sợ hãi, cô bé hít thở sâu và tự nhủ: "Mình có thể làm được!"</p>
                                
                                <p>Cô giáo cũng dạy Hoa cách "Chia nhỏ mục tiêu": "Thay vì nghĩ về việc phát biểu trước cả lớp, hãy bắt đầu bằng việc giơ tay trả lời câu hỏi đơn giản."</p>
                                
                                <p>Hoa bắt đầu thử giơ tay trả lời những câu hỏi dễ. Mỗi lần được cô giáo khen, cô bé cảm thấy tự tin hơn một chút.</p>
                                
                                <p>Một ngày, Hoa được chọn làm nhóm trưởng cho dự án khoa học. Ban đầu cô bé rất sợ, nhưng nhớ lại những gì cô giáo dạy, cô bé đã hít thở sâu và nhận lời.</p>
                                
                                <p>Hoa đã dẫn dắt nhóm một cách xuất sắc và dự án của nhóm đạt giải nhất. Cô bé nhận ra rằng mình có thể làm được nhiều điều hơn mình nghĩ.</p>
                                
                                <p>Từ đó, Hoa trở thành một cô bé tự tin, dám thử những điều mới và luôn tin tưởng vào khả năng của bản thân.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Hãy tin tưởng vào khả năng của bản thân và bắt đầu từ những việc nhỏ. Mỗi bước tiến bộ sẽ giúp chúng ta tự tin hơn và dám thử những điều mới.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                }
            ]
        },
        'giao-tiep-ung-xu': {
            title: 'Giao tiếp và ứng xử',
            stories: [
                {
                    id: '2',
                    title: 'Bạn bè và Sự chia sẻ',
                    description: 'Học cách chia sẻ cảm xúc với bạn bè một cách tích cực',
                    content: `
                        <div class="story-content-full">
                            <h3>Bạn bè và Sự chia sẻ</h3>
                            <div class="story-text">
                                <p>Minh và Lan là hai người bạn thân từ nhỏ. Họ luôn chơi cùng nhau, học cùng nhau, và chia sẻ mọi thứ với nhau.</p>
                                
                                <p>Một ngày, Lan cảm thấy rất buồn vì bị điểm kém trong bài kiểm tra toán. Lan sợ bố mẹ sẽ thất vọng và bạn bè sẽ cười chê. Cô bé đã khóc một mình trong phòng.</p>
                                
                                <p>Minh đến nhà Lan và thấy bạn đang buồn. Thay vì hỏi ngay, Minh đã ngồi bên cạnh Lan và hỏi: "Bạn có muốn chia sẻ với mình không? Mình sẽ lắng nghe."</p>
                                
                                <p>Lan đã kể cho Minh nghe về nỗi buồn của mình. Minh không chỉ lắng nghe mà còn động viên: "Điểm kém không có nghĩa là bạn kém thông minh. Có thể bạn chỉ cần học cách khác thôi. Mình sẽ giúp bạn học toán nhé!"</p>
                                
                                <p>Từ đó, Minh và Lan học cùng nhau mỗi ngày. Minh dạy Lan cách giải toán dễ hiểu hơn, và Lan cũng giúp Minh học tiếng Anh. Cả hai đều tiến bộ rất nhiều.</p>
                                
                                <p>Một lần khác, Minh cảm thấy lo lắng vì sắp thi học kỳ. Lan đã an ủi: "Bạn đã học rất chăm chỉ rồi, mình tin bạn sẽ làm tốt. Nếu bạn lo lắng, hãy hít thở sâu và nghĩ về những điều tích cực."</p>
                                
                                <p>Nhờ sự chia sẻ và hỗ trợ lẫn nhau, cả hai đã vượt qua nhiều khó khăn và trở nên thân thiết hơn. Họ học được rằng tình bạn thật sự là khi có thể chia sẻ cả niềm vui và nỗi buồn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chia sẻ cảm xúc với bạn bè không chỉ giúp chúng ta cảm thấy tốt hơn mà còn làm tình bạn thêm gắn bó. Hãy lắng nghe và hỗ trợ bạn bè khi họ cần.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '10',
                    title: 'Lời Xin Lỗi Chân Thành',
                    description: 'Học cách xin lỗi và tha thứ một cách chân thành',
                    content: `
                        <div class="story-content-full">
                            <h3>Lời Xin Lỗi Chân Thành</h3>
                            <div class="story-text">
                                <p>Hoa và Minh là hai bạn cùng lớp rất thân thiết. Một ngày, trong lúc chơi đá bóng, Hoa vô tình làm Minh ngã và bị trầy xước tay.</p>
                                
                                <p>Minh rất tức giận và nói: "Bạn cố ý làm mình ngã! Mình không chơi với bạn nữa!" Hoa cảm thấy rất buồn và không biết phải làm gì.</p>
                                
                                <p>Về nhà, mẹ Hoa thấy con buồn bã và hỏi chuyện. Hoa kể lại sự việc và mẹ đã dạy: "Khi làm sai, con cần xin lỗi chân thành. Hãy nói rõ lỗi của mình và hứa sẽ cẩn thận hơn."</p>
                                
                                <p>Hôm sau, Hoa đến gặp Minh và nói: "Minh ơi, mình xin lỗi vì đã làm bạn ngã. Mình không cố ý, nhưng mình đã không cẩn thận. Mình hứa sẽ chơi cẩn thận hơn. Bạn có thể tha thứ cho mình không?"</p>
                                
                                <p>Minh nhìn thấy sự chân thành trong lời xin lỗi của Hoa và nói: "Mình tha thứ cho bạn. Mình cũng xin lỗi vì đã nói nặng lời. Chúng ta vẫn là bạn nhé!"</p>
                                
                                <p>Từ đó, hai bạn hiểu rằng xin lỗi chân thành và tha thứ là điều quan trọng trong tình bạn. Họ trở nên thân thiết hơn và luôn cẩn thận khi chơi cùng nhau.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Khi làm sai, hãy xin lỗi chân thành và hứa sẽ cẩn thận hơn. Tha thứ cho người khác cũng giúp chúng ta cảm thấy tốt hơn và giữ được tình bạn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '11',
                    title: 'Lắng Nghe Tích Cực',
                    description: 'Học cách lắng nghe và hiểu cảm xúc của người khác',
                    content: `
                        <div class="story-content-full">
                            <h3>Lắng Nghe Tích Cực</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé rất hay nói và ít khi lắng nghe người khác. Khi bạn bè kể chuyện, cậu thường ngắt lời hoặc chỉ nghĩ về câu chuyện của mình.</p>
                                
                                <p>Một ngày, bạn Lan đến tìm Nam và muốn chia sẻ về việc em trai bị ốm. Nhưng Nam cứ nói về trò chơi mới của mình mà không để ý đến cảm xúc của Lan.</p>
                                
                                <p>Lan cảm thấy buồn và bỏ đi. Nam nhận ra rằng mình đã không lắng nghe bạn và cảm thấy có lỗi.</p>
                                
                                <p>Cô giáo đã dạy Nam về "Lắng nghe tích cực": "Khi ai đó nói chuyện với con, hãy nhìn vào mắt họ, gật đầu, và đặt câu hỏi để hiểu rõ hơn. Đừng ngắt lời và hãy quan tâm đến cảm xúc của họ."</p>
                                
                                <p>Nam bắt đầu thực hành cách lắng nghe tích cực. Khi Lan quay lại, cậu đã ngồi xuống, nhìn vào mắt Lan và nói: "Mình xin lỗi vì đã không lắng nghe bạn. Bạn kể cho mình nghe về em trai nhé."</p>
                                
                                <p>Lan cảm thấy được quan tâm và kể cho Nam nghe về nỗi lo lắng của mình. Nam lắng nghe chăm chú và an ủi Lan. Từ đó, Lan cảm thấy gần gũi với Nam hơn.</p>
                                
                                <p>Nam học được rằng lắng nghe tích cực không chỉ giúp hiểu người khác mà còn làm cho họ cảm thấy được quan tâm và yêu thương.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Lắng nghe tích cực là kỹ năng quan trọng trong giao tiếp. Hãy nhìn vào mắt người nói, gật đầu, và đặt câu hỏi để hiểu rõ hơn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '12',
                    title: 'Giải Quyết Xung Đột',
                    description: 'Học cách giải quyết mâu thuẫn một cách hòa bình',
                    content: `
                        <div class="story-content-full">
                            <h3>Giải Quyết Xung Đột</h3>
                            <div class="story-text">
                                <p>Minh và Hoa cùng muốn chơi với chiếc xe đạp mới của Lan. Cả hai đều tranh giành và cãi nhau, làm Lan cảm thấy khó xử.</p>
                                
                                <p>Lan đã dừng lại và nói: "Các bạn ơi, cãi nhau không giải quyết được gì cả. Hãy cùng tìm cách chia sẻ nhé."</p>
                                
                                <p>Lan đã dạy các bạn cách "Giải quyết xung đột": "Đầu tiên, mỗi người hãy nói về cảm xúc của mình. Sau đó, cùng tìm giải pháp mà ai cũng hài lòng."</p>
                                
                                <p>Minh nói: "Mình cảm thấy buồn vì muốn chơi xe đạp trước." Hoa nói: "Mình cũng muốn chơi và cảm thấy không công bằng."</p>
                                
                                <p>Lan gợi ý: "Chúng ta có thể chia thời gian chơi. Minh chơi 10 phút trước, sau đó đến lượt Hoa. Như vậy ai cũng được chơi."</p>
                                
                                <p>Cả hai đồng ý với giải pháp này. Minh chơi xe đạp trước, sau đó đến lượt Hoa. Cả hai đều vui vẻ và không còn cãi nhau nữa.</p>
                                
                                <p>Từ đó, ba bạn học được cách giải quyết xung đột một cách hòa bình và luôn tìm cách chia sẻ với nhau.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Khi có xung đột, hãy dừng lại, lắng nghe cảm xúc của nhau, và cùng tìm giải pháp hòa bình. Chia sẻ và thỏa hiệp là chìa khóa của tình bạn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '13',
                    title: 'Lời Khen Chân Thành',
                    description: 'Học cách khen ngợi và khuyến khích người khác',
                    content: `
                        <div class="story-content-full">
                            <h3>Lời Khen Chân Thành</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé rất giỏi vẽ nhưng lại nhút nhát và không dám chia sẻ tác phẩm của mình. Cô bé luôn nghĩ rằng tranh của mình không đẹp.</p>
                                
                                <p>Một ngày, Lan tình cờ thấy Hoa vẽ và nói: "Ôi, tranh của bạn đẹp quá! Mình thích cách bạn phối màu này. Bạn vẽ giỏi thật đấy!"</p>
                                
                                <p>Hoa cảm thấy rất vui vì lời khen của Lan. Cô bé nói: "Thật không? Mình cứ nghĩ tranh mình không đẹp."</p>
                                
                                <p>Lan đã dạy Hoa về "Lời khen chân thành": "Khi thấy ai đó làm tốt, hãy khen họ một cách cụ thể. Điều này sẽ giúp họ tự tin hơn và cảm thấy được khuyến khích."</p>
                                
                                <p>Từ đó, Hoa bắt đầu dám chia sẻ tranh của mình và nhận được nhiều lời khen từ bạn bè. Cô bé cũng học cách khen ngợi người khác một cách chân thành.</p>
                                
                                <p>Một lần, Hoa thấy Minh giải toán rất nhanh và nói: "Minh ơi, mình thích cách bạn giải bài toán này. Bạn giải rất logic và dễ hiểu!"</p>
                                
                                <p>Minh cảm thấy rất vui và tự tin hơn. Từ đó, cả hai đều học được rằng lời khen chân thành có thể làm thay đổi cảm xúc và động lực của người khác.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Lời khen chân thành và cụ thể có thể làm thay đổi cảm xúc của người khác. Hãy khen ngợi khi thấy ai đó làm tốt và khuyến khích họ tiếp tục cố gắng.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                }
            ]
        },
        'gia-dinh': {
            title: 'Gia đình',
            stories: [
                {
                    id: '3',
                    title: 'Tình cảm gia đình',
                    description: 'Những câu chuyện về tình cảm gia đình và mối quan hệ',
                    content: `
                        <div class="story-content-full">
                            <h3>Tình cảm gia đình</h3>
                            <div class="story-text">
                                <p>Minh là một cậu bé 8 tuổi, sống trong một gia đình hạnh phúc với bố mẹ và em gái. Nhưng đôi khi Minh cảm thấy bố mẹ không hiểu mình.</p>
                                
                                <p>Một ngày, Minh bị điểm kém và sợ bố mẹ sẽ thất vọng. Cậu đã giấu bài kiểm tra và nói dối rằng mình đã làm tốt. Nhưng bố mẹ đã phát hiện ra sự thật.</p>
                                
                                <p>Thay vì la mắng, bố mẹ đã ngồi xuống và nói chuyện với Minh: "Con ơi, bố mẹ yêu con không phải vì điểm số mà vì con là con của bố mẹ. Hãy thành thật với bố mẹ nhé."</p>
                                
                                <p>Minh đã khóc và xin lỗi bố mẹ. Từ đó, cậu luôn thành thật và chia sẻ mọi thứ với gia đình. Minh nhận ra rằng gia đình là nơi an toàn nhất để chia sẻ cảm xúc.</p>
                                
                                <p>Một lần khác, em gái Minh bị ốm. Minh đã chăm sóc em, đọc truyện cho em nghe, và giúp bố mẹ làm việc nhà. Cậu cảm thấy rất hạnh phúc khi được giúp đỡ gia đình.</p>
                                
                                <p>Từ đó, Minh hiểu rằng gia đình là nơi quan trọng nhất trong cuộc sống. Tình yêu thương và sự hỗ trợ của gia đình giúp cậu vượt qua mọi khó khăn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Gia đình là nơi an toàn nhất để chia sẻ cảm xúc và tìm kiếm sự hỗ trợ. Hãy thành thật và yêu thương những người thân trong gia đình.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '14',
                    title: 'Bữa cơm gia đình',
                    description: 'Học cách trân trọng những khoảnh khắc bên gia đình',
                    content: `
                        <div class="story-content-full">
                            <h3>Bữa cơm gia đình</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé 9 tuổi rất bận rộn với việc học và chơi. Cô bé thường ăn cơm một mình hoặc vừa ăn vừa xem tivi, không chú ý đến bố mẹ.</p>
                                
                                <p>Một ngày, bố Hoa nói: "Con ơi, bữa cơm gia đình là lúc chúng ta cùng nhau chia sẻ về một ngày của mình. Hãy tắt tivi và cùng trò chuyện nhé."</p>
                                
                                <p>Hoa ban đầu cảm thấy khó chịu vì không được xem tivi. Nhưng khi nghe bố mẹ kể về công việc và em trai kể về trường học, cô bé thấy thú vị hơn nhiều.</p>
                                
                                <p>Từ đó, Hoa bắt đầu kể về những gì đã học ở trường, về bạn bè, và những điều thú vị trong ngày. Cả gia đình cùng cười vui vẻ và cảm thấy gần gũi hơn.</p>
                                
                                <p>Một lần, Hoa gặp khó khăn với bài toán khó. Thay vì giấu kín, cô bé đã chia sẻ với gia đình trong bữa cơm. Bố mẹ và em trai đã cùng giúp Hoa giải bài toán.</p>
                                
                                <p>Hoa nhận ra rằng bữa cơm gia đình không chỉ là ăn uống mà còn là lúc để yêu thương, chia sẻ và hỗ trợ lẫn nhau. Đó là khoảnh khắc quý giá nhất trong ngày.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Bữa cơm gia đình là thời gian quý giá để cùng nhau chia sẻ và yêu thương. Hãy trân trọng những khoảnh khắc bên gia đình.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '15',
                    title: 'Em trai và Tình anh em',
                    description: 'Học cách yêu thương và chăm sóc em trai',
                    content: `
                        <div class="story-content-full">
                            <h3>Em trai và Tình anh em</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé 10 tuổi có em trai 6 tuổi tên là Minh. Nam thường cảm thấy em trai làm phiền mình và không muốn chơi cùng.</p>
                                
                                <p>Một ngày, Minh bị ngã và khóc. Nam thấy em trai đau đớn nhưng không biết phải làm gì. Mẹ đã dạy Nam: "Em trai cần sự quan tâm và yêu thương của anh. Hãy chăm sóc em như cách bố mẹ chăm sóc con."</p>
                                
                                <p>Nam bắt đầu chú ý đến em trai hơn. Cậu dạy Minh chơi cờ, đọc truyện cho em nghe, và giúp em làm bài tập. Minh rất vui vì được anh quan tâm.</p>
                                
                                <p>Một lần, Minh bị bạn bè trêu chọc ở trường. Nam đã đến bảo vệ em và dạy Minh cách đối phó với tình huống này. Minh cảm thấy rất an toàn khi có anh bên cạnh.</p>
                                
                                <p>Từ đó, Nam và Minh trở thành những người bạn thân thiết. Nam nhận ra rằng tình anh em là món quà quý giá nhất mà bố mẹ đã tặng cho mình.</p>
                                
                                <p>Nam học được rằng làm anh trai không chỉ là trách nhiệm mà còn là niềm hạnh phúc khi được yêu thương và bảo vệ em trai.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Tình anh em là món quà quý giá. Hãy yêu thương, chăm sóc và bảo vệ em trai/em gái của mình.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '16',
                    title: 'Bố mẹ và Công việc',
                    description: 'Hiểu và cảm thông với công việc của bố mẹ',
                    content: `
                        <div class="story-content-full">
                            <h3>Bố mẹ và Công việc</h3>
                            <div class="story-text">
                                <p>Lan là một cô bé 8 tuổi thường cảm thấy buồn vì bố mẹ đi làm cả ngày và ít thời gian chơi với mình. Cô bé nghĩ rằng bố mẹ không yêu mình.</p>
                                
                                <p>Một ngày, Lan hỏi mẹ: "Tại sao bố mẹ phải đi làm cả ngày? Tại sao không ở nhà chơi với con?" Mẹ đã giải thích: "Bố mẹ đi làm để kiếm tiền mua thức ăn, quần áo, và đồ chơi cho con. Đó là cách bố mẹ thể hiện tình yêu với con."</p>
                                
                                <p>Lan bắt đầu quan sát bố mẹ làm việc ở nhà. Cô bé thấy bố phải làm việc trên máy tính đến khuya, mẹ phải nấu ăn và dọn dẹp nhà cửa. Lan hiểu rằng bố mẹ rất vất vả.</p>
                                
                                <p>Từ đó, Lan bắt đầu giúp đỡ bố mẹ: dọn dẹp phòng, rửa bát, và học bài chăm chỉ. Cô bé cũng không quấy rầy khi bố mẹ đang làm việc.</p>
                                
                                <p>Một ngày, Lan thấy bố mẹ rất mệt mỏi sau giờ làm việc. Cô bé đã pha trà cho bố mẹ và massage vai cho họ. Bố mẹ cảm thấy rất hạnh phúc và tự hào về Lan.</p>
                                
                                <p>Lan học được rằng tình yêu không chỉ thể hiện qua việc chơi cùng nhau mà còn qua sự hiểu biết, cảm thông và giúp đỡ lẫn nhau trong gia đình.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Hãy hiểu và cảm thông với công việc của bố mẹ. Tình yêu được thể hiện qua sự quan tâm và giúp đỡ lẫn nhau.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '17',
                    title: 'Ông bà và Tình yêu thương',
                    description: 'Học cách yêu thương và kính trọng ông bà',
                    content: `
                        <div class="story-content-full">
                            <h3>Ông bà và Tình yêu thương</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé 9 tuổi sống cùng ông bà nội. Cô bé thường cảm thấy khó chịu vì ông bà hay nhắc nhở và không hiểu những gì mình thích.</p>
                                
                                <p>Một ngày, Hoa thấy ông bà rất buồn vì không biết sử dụng điện thoại thông minh để gọi video cho con cháu ở xa. Cô bé đã dạy ông bà cách sử dụng.</p>
                                
                                <p>Khi thấy ông bà vui vẻ gọi video cho các cô chú, Hoa cảm thấy rất hạnh phúc. Cô bé nhận ra rằng ông bà cũng cần sự giúp đỡ và quan tâm.</p>
                                
                                <p>Từ đó, Hoa bắt đầu dành thời gian cho ông bà: nghe ông kể chuyện xưa, giúp bà nấu ăn, và chơi cờ với ông. Ông bà rất vui vì được cháu quan tâm.</p>
                                
                                <p>Một lần, ông bà ốm, Hoa đã chăm sóc họ: đưa thuốc, nấu cháo, và đọc báo cho ông bà nghe. Ông bà cảm động và nói: "Cháu ngoan quá, ông bà yêu cháu lắm!"</p>
                                
                                <p>Hoa học được rằng ông bà là kho báu quý giá của gia đình. Tình yêu thương và sự kính trọng dành cho ông bà sẽ được truyền lại cho thế hệ sau.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Ông bà là kho báu quý giá của gia đình. Hãy yêu thương, kính trọng và chăm sóc ông bà với tất cả tình cảm.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                }
            ]
        },
        'tu-duy-tich-cuc': {
            title: 'Tư duy tích cực và kiểm soát hành vi',
            stories: [
                {
                    id: '4',
                    title: 'Vượt qua Nỗi sợ',
                    description: 'Một câu chuyện về cách đối mặt và vượt qua những nỗi sợ hãi',
                    content: `
                        <div class="story-content-full">
                            <h3>Vượt qua Nỗi sợ</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé rất sợ bóng tối. Mỗi khi trời tối, cô bé thường khóc và gọi mẹ. Hoa sợ rằng trong bóng tối có những con quái vật đang ẩn nấp.</p>
                                
                                <p>Một ngày, mẹ đã dạy Hoa cách đối mặt với nỗi sợ: "Con ơi, sợ hãi là cảm xúc bình thường. Nhưng thay vì trốn tránh, con hãy thử hiểu nỗi sợ của mình. Bóng tối không có gì đáng sợ cả, nó chỉ là không có ánh sáng thôi."</p>
                                
                                <p>Mẹ đã dạy Hoa cách thở sâu và đếm từ 1 đến 10 khi cảm thấy sợ. Mẹ cũng dạy Hoa tưởng tượng về những điều tích cực, như những ngôi sao lấp lánh trên bầu trời đêm.</p>
                                
                                <p>Hoa bắt đầu thử ngủ một mình với đèn ngủ nhỏ. Cô bé học cách thở sâu và nghĩ về những điều vui vẻ. Dần dần, Hoa nhận ra rằng bóng tối không đáng sợ như cô bé nghĩ.</p>
                                
                                <p>Một đêm, Hoa nghe thấy tiếng động trong phòng. Thay vì sợ hãi, cô bé đã thở sâu và kiểm tra xem đó là gì. Hóa ra đó chỉ là tiếng gió thổi qua cửa sổ. Hoa cảm thấy rất tự hào vì đã vượt qua nỗi sợ.</p>
                                
                                <p>Từ đó, Hoa không còn sợ bóng tối nữa. Cô bé thậm chí còn thích ngắm sao vào ban đêm. Hoa học được rằng khi chúng ta đối mặt với nỗi sợ, chúng ta sẽ trở nên mạnh mẽ hơn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chúng ta có thể học cách đối mặt và vượt qua những nỗi sợ hãi bằng cách hiểu và chấp nhận chúng. Hãy thở sâu và nghĩ về những điều tích cực khi cảm thấy sợ.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '18',
                    title: 'Tư duy tích cực',
                    description: 'Học cách suy nghĩ tích cực trong mọi tình huống',
                    content: `
                        <div class="story-content-full">
                            <h3>Tư duy tích cực</h3>
                            <div class="story-text">
                                <p>Lan là một cô bé 8 tuổi thường suy nghĩ tiêu cực. Khi gặp khó khăn, cô bé thường nói: "Mình không làm được đâu", "Mình thật kém cỏi", hoặc "Mọi thứ đều tệ hại".</p>
                                
                                <p>Một ngày, Lan bị điểm kém môn toán. Thay vì cố gắng, cô bé nói: "Mình không giỏi toán, mình sẽ không bao giờ học được." Mẹ Lan nghe thấy và nói: "Con ơi, hãy thử suy nghĩ tích cực hơn."</p>
                                
                                <p>Mẹ dạy Lan cách thay đổi suy nghĩ: "Thay vì nói 'Mình không làm được', hãy nói 'Mình sẽ cố gắng'. Thay vì nói 'Mình kém cỏi', hãy nói 'Mình đang học hỏi'."</p>
                                
                                <p>Lan bắt đầu thực hành tư duy tích cực. Khi gặp bài toán khó, cô bé nói: "Bài này khó nhưng mình sẽ cố gắng giải." Khi bị bạn trêu chọc, cô bé nói: "Có thể họ đang vui đùa, mình sẽ không để ý."</p>
                                
                                <p>Dần dần, Lan nhận thấy rằng khi suy nghĩ tích cực, mọi thứ trở nên dễ dàng hơn. Cô bé học tốt hơn, có nhiều bạn bè hơn, và cảm thấy hạnh phúc hơn.</p>
                                
                                <p>Lan học được rằng tư duy tích cực không chỉ giúp mình vượt qua khó khăn mà còn làm cho cuộc sống trở nên tươi đẹp hơn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Tư duy tích cực giúp chúng ta vượt qua khó khăn và sống hạnh phúc hơn. Hãy luôn suy nghĩ tích cực trong mọi tình huống.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '19',
                    title: 'Kiểm soát cơn giận',
                    description: 'Học cách kiểm soát cơn giận một cách hiệu quả',
                    content: `
                        <div class="story-content-full">
                            <h3>Kiểm soát cơn giận</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé 10 tuổi có tính nóng nảy. Khi tức giận, cậu thường đánh bạn, ném đồ đạc, hoặc la hét rất to. Điều này khiến Nam mất nhiều bạn bè.</p>
                                
                                <p>Một ngày, Nam tức giận vì bạn lấy mất bút chì của mình. Cậu đã đánh bạn và bị cô giáo phạt. Cô giáo nói: "Nam ơi, cơn giận là cảm xúc bình thường, nhưng cách con thể hiện cơn giận không đúng."</p>
                                
                                <p>Cô giáo dạy Nam một kỹ thuật gọi là "Dừng lại và Suy nghĩ": "Khi con cảm thấy tức giận, hãy dừng lại, hít thở sâu, và suy nghĩ về hậu quả trước khi hành động."</p>
                                
                                <p>Nam bắt đầu thực hành kỹ thuật này. Lần đầu, cậu vẫn nổi giận, nhưng dần dần cậu học được cách kiểm soát. Thay vì đánh bạn, cậu nói: "Tôi đang tức giận, tôi cần một chút thời gian."</p>
                                
                                <p>Một lần, Nam bị bạn trêu chọc. Thay vì đánh bạn, cậu đã dừng lại, hít thở sâu, và nói: "Tôi không thích cách bạn nói chuyện. Hãy dừng lại." Bạn của Nam đã xin lỗi.</p>
                                
                                <p>Từ đó, Nam trở thành một cậu bé biết kiểm soát cơn giận. Cậu học được rằng kiểm soát cảm xúc giúp mình có nhiều bạn bè và sống hạnh phúc hơn.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Cơn giận là cảm xúc bình thường, nhưng chúng ta cần học cách kiểm soát nó. Hãy dừng lại và suy nghĩ trước khi hành động.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '20',
                    title: 'Tự tin và Lòng tự trọng',
                    description: 'Học cách xây dựng lòng tự tin và tự trọng',
                    content: `
                        <div class="story-content-full">
                            <h3>Tự tin và Lòng tự trọng</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé 9 tuổi rất nhút nhát và thiếu tự tin. Cô bé thường sợ phát biểu trong lớp, không dám tham gia hoạt động nhóm, và luôn nghĩ mình kém cỏi hơn các bạn.</p>
                                
                                <p>Một ngày, cô giáo gọi Hoa lên bảng làm bài. Hoa run rẩy và không dám nói gì. Cô giáo nói: "Hoa ơi, con có thể làm được. Hãy tin vào bản thân mình."</p>
                                
                                <p>Cô giáo dạy Hoa cách xây dựng lòng tự tin: "Mỗi ngày, hãy nói với bản thân: 'Mình có thể làm được', 'Mình là người đặc biệt', 'Mình xứng đáng được yêu thương'."</p>
                                
                                <p>Hoa bắt đầu thực hành. Cô bé đứng trước gương mỗi sáng và nói những câu tích cực về bản thân. Dần dần, cô bé cảm thấy tự tin hơn.</p>
                                
                                <p>Một lần, Hoa được chọn tham gia cuộc thi kể chuyện. Ban đầu cô bé rất sợ, nhưng nhớ lời cô giáo, cô bé đã tự tin kể câu chuyện và giành giải nhì.</p>
                                
                                <p>Từ đó, Hoa trở thành một cô bé tự tin và tích cực. Cô bé học được rằng lòng tự tin không phải là không sợ hãi, mà là tin vào khả năng của bản thân.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Lòng tự tin và tự trọng là nền tảng của thành công. Hãy tin vào khả năng của bản thân và yêu thương chính mình.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '21',
                    title: 'Kiên trì và Không bỏ cuộc',
                    description: 'Học cách kiên trì và không bỏ cuộc khi gặp khó khăn',
                    content: `
                        <div class="story-content-full">
                            <h3>Kiên trì và Không bỏ cuộc</h3>
                            <div class="story-text">
                                <p>Minh là một cậu bé 8 tuổi rất dễ bỏ cuộc. Khi gặp bài tập khó, cậu thường nói: "Mình không làm được" và bỏ dở. Khi học kỹ năng mới, cậu cũng nhanh chóng từ bỏ.</p>
                                
                                <p>Một ngày, Minh muốn học đi xe đạp. Sau vài lần ngã, cậu nói: "Mình không thể học được, mình sẽ không bao giờ biết đi xe đạp." Bố Minh nghe thấy và nói: "Con ơi, hãy kiên trì thêm một chút nữa."</p>
                                
                                <p>Bố dạy Minh về sức mạnh của sự kiên trì: "Mọi thứ đều khó khăn lúc đầu, nhưng nếu con kiên trì, con sẽ thành công. Hãy thử lại từng bước một."</p>
                                
                                <p>Minh bắt đầu thực hành kiên trì. Cậu học đi xe đạp từng bước: giữ thăng bằng, đạp chậm, rồi tăng tốc. Sau một tuần, cậu đã biết đi xe đạp.</p>
                                
                                <p>Từ đó, Minh áp dụng sự kiên trì vào mọi việc: học bài, chơi thể thao, và học kỹ năng mới. Cậu nhận ra rằng kiên trì là chìa khóa của thành công.</p>
                                
                                <p>Minh học được rằng không có gì là không thể nếu chúng ta kiên trì và không bỏ cuộc. Mỗi lần thất bại là một bước tiến gần hơn đến thành công.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Kiên trì và không bỏ cuộc là chìa khóa của thành công. Hãy tiếp tục cố gắng ngay cả khi gặp khó khăn.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center'
                }
            ]
        },
        'su-chia-se': {
            title: 'Sự chia sẻ',
            stories: [
                {
                    id: '5',
                    title: 'Làm việc nhóm',
                    description: 'Học cách hợp tác và làm việc cùng bạn bè để đạt được mục tiêu chung',
                    content: `
                        <div class="story-content-full">
                            <h3>Làm việc nhóm</h3>
                            <div class="story-text">
                                <p>Minh, Lan và Hoa được cô giáo giao nhiệm vụ làm một dự án về môi trường. Ban đầu, cả ba đều muốn làm theo ý kiến của mình và không chịu lắng nghe nhau.</p>
                                
                                <p>Minh muốn làm poster về rừng, Lan muốn làm video về biển, còn Hoa muốn làm mô hình về thành phố xanh. Cả ba đều cãi nhau và không ai chịu nhường ai.</p>
                                
                                <p>Cô giáo đã dạy các bạn: "Làm việc nhóm không có nghĩa là ai cũng phải làm giống nhau. Mỗi người có thể đóng góp ý tưởng riêng, nhưng cần biết lắng nghe và hợp tác với nhau."</p>
                                
                                <p>Từ đó, ba bạn đã học cách chia sẻ ý tưởng và lắng nghe nhau. Minh vẽ poster rừng, Lan quay video biển, còn Hoa làm mô hình thành phố. Kết quả là một dự án hoàn chỉnh về môi trường.</p>
                                
                                <p>Khi trình bày trước lớp, cả ba đều tự hào về thành quả chung. Họ nhận ra rằng khi hợp tác, mọi việc sẽ dễ dàng và thú vị hơn nhiều.</p>
                                
                                <p>Từ đó, ba bạn trở thành nhóm bạn thân và thường xuyên làm việc cùng nhau. Họ học được rằng tình bạn và sự hợp tác là chìa khóa của thành công.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Làm việc nhóm giúp chúng ta học hỏi từ nhau và đạt được kết quả tốt hơn. Hãy lắng nghe, chia sẻ và hợp tác với bạn bè.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '22',
                    title: 'Chia sẻ đồ chơi',
                    description: 'Học cách chia sẻ đồ chơi và đồ dùng với bạn bè',
                    content: `
                        <div class="story-content-full">
                            <h3>Chia sẻ đồ chơi</h3>
                            <div class="story-text">
                                <p>Nam là một cậu bé 7 tuổi có rất nhiều đồ chơi đẹp. Cậu thường giữ riêng tất cả đồ chơi và không cho ai chơi cùng. Điều này khiến các bạn không muốn chơi với Nam.</p>
                                
                                <p>Một ngày, bạn Minh đến nhà Nam chơi. Minh thấy chiếc xe điều khiển từ xa rất đẹp và muốn chơi cùng. Nhưng Nam từ chối: "Đây là đồ chơi của mình, mình không cho ai chơi."</p>
                                
                                <p>Minh buồn bã và về nhà. Nam cảm thấy cô đơn vì không có ai chơi cùng. Mẹ Nam thấy vậy và nói: "Con ơi, đồ chơi sẽ vui hơn khi có bạn cùng chơi. Hãy thử chia sẻ với bạn bè nhé."</p>
                                
                                <p>Nam bắt đầu thay đổi. Cậu mời Minh đến chơi và cho bạn chơi xe điều khiển. Hai bạn cùng chơi rất vui vẻ và cười đùa suốt buổi chiều.</p>
                                
                                <p>Từ đó, Nam thường xuyên chia sẻ đồ chơi với bạn bè. Cậu nhận ra rằng khi chia sẻ, mình có nhiều bạn bè hơn và vui vẻ hơn nhiều.</p>
                                
                                <p>Nam học được rằng chia sẻ không có nghĩa là mất đi, mà là nhận được nhiều hơn: tình bạn, niềm vui, và sự hạnh phúc.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chia sẻ đồ chơi và đồ dùng giúp chúng ta có nhiều bạn bè và vui vẻ hơn. Hãy học cách chia sẻ với mọi người xung quanh.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '23',
                    title: 'Chia sẻ kiến thức',
                    description: 'Học cách chia sẻ kiến thức và giúp đỡ bạn bè học tập',
                    content: `
                        <div class="story-content-full">
                            <h3>Chia sẻ kiến thức</h3>
                            <div class="story-text">
                                <p>Hoa là một cô bé 9 tuổi rất giỏi toán. Cô bé thường giải được những bài toán khó mà các bạn khác không làm được. Nhưng Hoa không bao giờ giúp đỡ bạn bè.</p>
                                
                                <p>Một ngày, bạn Lan gặp khó khăn với bài toán về phân số. Lan hỏi Hoa: "Bạn có thể giúp mình giải bài này không?" Nhưng Hoa từ chối: "Mình không có thời gian, bạn tự làm đi."</p>
                                
                                <p>Lan buồn bã và phải nhờ cô giáo giúp đỡ. Cô giáo thấy vậy và nói với Hoa: "Con ơi, khi con chia sẻ kiến thức với bạn, con cũng học được nhiều điều. Hãy giúp đỡ bạn bè nhé."</p>
                                
                                <p>Hoa bắt đầu thay đổi. Cô bé chủ động giúp Lan giải bài toán về phân số. Khi giảng giải, Hoa cũng hiểu rõ hơn về kiến thức của mình.</p>
                                
                                <p>Từ đó, Hoa thường xuyên giúp đỡ bạn bè trong học tập. Cô bé nhận ra rằng khi chia sẻ kiến thức, mình trở thành người bạn tốt và được mọi người yêu quý.</p>
                                
                                <p>Hoa học được rằng kiến thức sẽ tăng lên khi được chia sẻ. Giúp đỡ bạn bè học tập là cách tốt nhất để củng cố kiến thức của bản thân.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chia sẻ kiến thức giúp chúng ta học hỏi thêm và trở thành người bạn tốt. Hãy giúp đỡ bạn bè trong học tập.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '24',
                    title: 'Chia sẻ cảm xúc',
                    description: 'Học cách chia sẻ cảm xúc và tâm sự với người thân',
                    content: `
                        <div class="story-content-full">
                            <h3>Chia sẻ cảm xúc</h3>
                            <div class="story-text">
                                <p>Minh là một cậu bé 8 tuổi thường giữ kín cảm xúc của mình. Khi buồn, tức giận, hoặc lo lắng, cậu không bao giờ nói với ai. Điều này khiến Minh cảm thấy cô đơn và khó chịu.</p>
                                
                                <p>Một ngày, Minh bị điểm kém và cảm thấy rất buồn. Cậu ngồi một mình trong phòng và khóc. Mẹ Minh thấy vậy và hỏi: "Con ơi, có chuyện gì vậy? Hãy chia sẻ với mẹ nhé."</p>
                                
                                <p>Ban đầu Minh không muốn nói, nhưng mẹ kiên nhẫn động viên. Cuối cùng, Minh đã chia sẻ về việc bị điểm kém và cảm giác thất vọng của mình.</p>
                                
                                <p>Mẹ đã ôm Minh và nói: "Con ơi, mẹ hiểu cảm giác của con. Điểm kém không có nghĩa là con kém cỏi. Hãy cố gắng hơn lần sau nhé." Minh cảm thấy nhẹ nhõm hơn nhiều.</p>
                                
                                <p>Từ đó, Minh học cách chia sẻ cảm xúc với gia đình và bạn bè. Cậu nhận ra rằng khi chia sẻ, mình cảm thấy được thấu hiểu và yêu thương.</p>
                                
                                <p>Minh học được rằng chia sẻ cảm xúc không phải là yếu đuối, mà là cách để nhận được sự hỗ trợ và yêu thương từ những người xung quanh.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Chia sẻ cảm xúc giúp chúng ta nhận được sự hỗ trợ và yêu thương. Hãy mở lòng với gia đình và bạn bè.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                },
                {
                    id: '25',
                    title: 'Chia sẻ thời gian',
                    description: 'Học cách chia sẻ thời gian và quan tâm đến người khác',
                    content: `
                        <div class="story-content-full">
                            <h3>Chia sẻ thời gian</h3>
                            <div class="story-text">
                                <p>Lan là một cô bé 10 tuổi rất bận rộn với việc học và chơi. Cô bé thường không có thời gian để chơi với em trai hoặc giúp đỡ bố mẹ. Lan nghĩ rằng thời gian của mình rất quý giá.</p>
                                
                                <p>Một ngày, em trai Lan bị ốm và muốn chị chơi cùng. Nhưng Lan từ chối: "Em ơi, chị đang bận học, em chơi một mình đi." Em trai buồn bã và khóc.</p>
                                
                                <p>Mẹ Lan thấy vậy và nói: "Con ơi, thời gian là món quà quý giá nhất mà con có thể chia sẻ với người thân. Hãy dành thời gian cho em trai nhé."</p>
                                
                                <p>Lan bắt đầu thay đổi. Cô bé dành 30 phút mỗi ngày để chơi với em trai, đọc truyện cho em nghe, và giúp em làm bài tập. Em trai rất vui vì được chị quan tâm.</p>
                                
                                <p>Từ đó, Lan cũng dành thời gian giúp bố mẹ làm việc nhà và trò chuyện với gia đình. Cô bé nhận ra rằng khi chia sẻ thời gian, mình nhận được nhiều tình yêu thương hơn.</p>
                                
                                <p>Lan học được rằng thời gian là món quà quý giá nhất. Chia sẻ thời gian với người thân là cách thể hiện tình yêu thương tốt nhất.</p>
                            </div>
                            <div class="story-moral">
                                <h4>Bài học:</h4>
                                <p>Thời gian là món quà quý giá nhất. Hãy chia sẻ thời gian với gia đình và bạn bè để thể hiện tình yêu thương.</p>
                            </div>
                        </div>
                    `,
                    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop&crop=center'
                }
            ]
        }
    };
    
    // Handle topic card clicks
    topicCards.forEach(card => {
        card.addEventListener('click', () => {
            const topicId = card.getAttribute('data-topic');
            const topic = topicData[topicId];
            
            if (topic) {
                showStoriesForTopic(topicId, topic);
            }
        });
    });
    
    // Handle back to topics button
    if (backToTopicsBtn) {
        backToTopicsBtn.addEventListener('click', () => {
            topicCardsGrid.style.display = 'grid';
            storiesList.style.display = 'none';
        });
    }
    
    function showStoriesForTopic(topicId, topic) {
        // Hide topic cards grid
        topicCardsGrid.style.display = 'none';
        
        // Show stories list
        storiesList.style.display = 'block';
        
        // Update title
        const storiesListTitle = document.getElementById('storiesListTitle');
        if (storiesListTitle) {
            storiesListTitle.textContent = `Những câu chuyện trong chủ đề ${topic.title}`;
        }
        
               // Render stories
               const storiesGrid = document.getElementById('storiesGrid');
               if (storiesGrid) {
                   storiesGrid.innerHTML = topic.stories.map(story => `
                       <div class="story-card flip-in-y hover-glow" data-story="${story.id}">
                           <div class="story-cover">
                               <div class="story-icon">
                                   <i class="fas fa-book-open"></i>
                               </div>
                           </div>
                           <div class="story-content">
                               <h4>${story.title}</h4>
                               <p>${story.description}</p>
                           </div>
                           <button class="read-story-btn">Đọc ngay</button>
                       </div>
                   `).join('');
            
            // Add event listeners to story cards
            storiesGrid.querySelectorAll('.story-card').forEach(card => {
                card.addEventListener('click', () => {
                    const storyId = card.getAttribute('data-story');
                    const story = topic.stories.find(s => s.id === storyId);
                    if (story) {
                        showStoryModal(story.title, story.content);
                        // Mark story as read
                        userProgress.readStory(storyId);
                    }
                });
            });
        }
    }
}

// Topics loader (stories/videos by topic)
function initTopics() {
    const topicsGrid = document.getElementById('topicsGrid');
    const itemsGrid = document.getElementById('itemsGrid');
    const topicItems = document.getElementById('topicItems');
    const topicTitle = document.getElementById('topicTitle');
    const backBtn = document.getElementById('backToTopics');
    if (!topicsGrid || !itemsGrid || !topicItems || !topicTitle || !backBtn) return;

    const categories = [
        { id: 'cam-xuc-co-ban', title: 'Cảm xúc cơ bản' },
        { id: 'tinh-ban', title: 'Tình bạn' },
        { id: 'gia-dinh', title: 'Gia đình' },
        { id: 'tu-lap', title: 'Tự lập' },
        { id: 'chia-se', title: 'Sự chia sẻ' }
    ];

    // Render topics
    topicsGrid.innerHTML = categories.map(c => `
        <div class="topic-card" data-id="${c.id}">
            <div class="topic-icon"><i class="fas fa-folder"></i></div>
            <div class="topic-info">
                <h4>${c.title}</h4>
                <p>Xem nội dung theo chủ đề</p>
            </div>
        </div>
    `).join('');

    topicsGrid.addEventListener('click', async (e) => {
        const card = e.target.closest('.topic-card');
        if (!card) return;
        const id = card.getAttribute('data-id');
        const meta = categories.find(x => x.id === id);
        await loadTopic(id, meta?.title || 'Chủ đề');
    });

    backBtn.addEventListener('click', () => {
        topicItems.style.display = 'none';
        topicsGrid.style.display = 'grid';
    });

    async function loadTopic(id, title) {
        try {
            topicsGrid.style.display = 'none';
            topicItems.style.display = 'block';
            topicTitle.textContent = title;

            // Load JSON from content/stories/{id}/index.json
            const res = await fetch(`content/stories/${id}/index.json`);
            const data = await res.json();
            const stories = Array.isArray(data.stories) ? data.stories : [];

            if (stories.length === 0) {
                itemsGrid.innerHTML = `<div class="empty">Chưa có nội dung trong chủ đề này. Bạn có thể thêm file JSON trong thư mục content/stories/${id}/index.json</div>`;
                return;
            }

            itemsGrid.innerHTML = stories.map(item => {
                const isVideo = item.type === 'video';
                return `
                <div class="topic-item ${isVideo ? 'video' : 'story'}">
                    <div class="item-cover">
                        <div class="item-icon"><i class="fas ${isVideo ? 'fa-video' : 'fa-book-open'}"></i></div>
                    </div>
                    <div class="item-content">
                        <h5>${item.title || 'Nội dung'}</h5>
                        <p>${item.description || ''}</p>
                        <div class="item-actions">
                            ${isVideo ? `<a class="btn" href="${item.url}" target="_blank" rel="noopener">Xem video</a>`
                                      : `<button class="btn read-item" data-title="${encodeURIComponent(item.title || '')}" data-content="${encodeURIComponent(item.content || '')}">Đọc</button>`}
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Bind read buttons
            itemsGrid.querySelectorAll('.read-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const t = decodeURIComponent(btn.getAttribute('data-title') || '');
                    const c = decodeURIComponent(btn.getAttribute('data-content') || '');
                    showStoryModal(t || 'Câu chuyện', `<div class="story-content-full"><div class="story-text"><p>${c.replace(/\n/g,'</p><p>')}</p></div></div>`);
                });
            });
        } catch (e) {
            itemsGrid.innerHTML = `<div class="empty">Không thể tải nội dung. Vui lòng kiểm tra file JSON.</div>`;
        }
    }
}

// Scroll Animation System
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.observerOptions);
        this.init();
    }
    
    init() {
        // Observe all animated elements
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in, .bounce-in, .rotate-in, .flip-in-x, .flip-in-y, .zoom-in, .slide-up, .slide-down, .elastic-in, .wiggle-in, .bounce-jump, .wiggle-bounce, .hop-skip, .spring-bounce');
        animatedElements.forEach(element => {
            this.observer.observe(element);
        });
        
        // Add smooth scroll to all anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Add stagger effect for child elements
                const staggerElements = entry.target.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5');
                staggerElements.forEach((element, index) => {
                    setTimeout(() => {
                        element.classList.add('visible');
                    }, index * 100);
                });
                
                // Stop observing this element
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// Interactive Effects System
class InteractiveEffects {
    constructor() {
        this.init();
    }
    
    init() {
        // Add hover effects to buttons
        this.addButtonEffects();
        
        // Add click effects
        this.addClickEffects();
        
        // Add typing effect to hero title
        this.addTypingEffect();
        
        // Add parallax scrolling
        this.addParallaxEffect();
    }
    
    addButtonEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('button, .btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    addClickEffects() {
        // Add shake effect on wrong answers
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('quiz-option') && e.target.classList.contains('wrong')) {
                e.target.classList.add('shake');
                setTimeout(() => {
                    e.target.classList.remove('shake');
                }, 500);
            }
        });
    }
    
    addTypingEffect() {
        // Typing effect disabled for page title as requested
        // Only apply to other elements if needed
    }
    
    addParallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.float');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }
}

// Initialize scroll animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    new ScrollAnimations();
    new InteractiveEffects();
});