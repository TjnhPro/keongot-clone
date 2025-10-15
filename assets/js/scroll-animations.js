// Scroll Animations - Universal for all pages

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
});

function initScrollAnimations() {
    // Add scroll-animate class to elements that should animate
    const elementsToAnimate = [
        '.section-header',
        '.feature-card',
        '.feature-card-large',
        '.benefit-card',
        '.step-card',
        '.testimonial-card',
        '.preview-card',
        '.story-card',
        '.help-card',
        '.api-notice',
        '.featured-sections'
    ];
    
    // Add classes to elements
    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            // Add delay based on index for staggered effect
            element.style.transitionDelay = `${index * 0.1}s`;
            element.classList.add('scroll-animate');
        });
    });
    
    // Create Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Optional: unobserve after animation to improve performance
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all elements with scroll-animate class
    const animateElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
    animateElements.forEach(element => {
        observer.observe(element);
    });
    
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });
    
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.05 });
    
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
}

// Add parallax effect to hero sections
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero, .tam-su-hero, .kham-pha-hero, .thu-gian-hero');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#dang-nhap') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
