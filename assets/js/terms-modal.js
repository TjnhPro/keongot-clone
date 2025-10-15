// Terms Modal JavaScript - Xử lý modal điều khoản sử dụng
document.addEventListener('DOMContentLoaded', function() {
    // Terms modal functionality
    const showTermsBtn = document.getElementById('showTerms');
    const termsModal = document.getElementById('termsModal');
    const closeTermsModal = document.getElementById('closeTermsModal');
    const agreeTermsBtn = document.getElementById('agreeTerms');
    const agreeCheckbox = document.querySelector('input[name="agree"]');

    // Show terms modal
    if (showTermsBtn) {
        showTermsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close terms modal
    if (closeTermsModal) {
        closeTermsModal.addEventListener('click', function() {
            termsModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close terms modal when clicking overlay
    if (termsModal) {
        termsModal.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Agree to terms
    if (agreeTermsBtn) {
        agreeTermsBtn.addEventListener('click', function() {
            agreeCheckbox.checked = true;
            termsModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Show toast if auth system is available
            if (typeof auth !== 'undefined') {
                auth.showToast('success', 'Đã đồng ý!', 'Bạn đã đồng ý với điều khoản sử dụng. Có thể tiếp tục đăng ký!');
            } else {
                alert('Bạn đã đồng ý với điều khoản sử dụng!');
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && termsModal && termsModal.classList.contains('active')) {
            termsModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});
