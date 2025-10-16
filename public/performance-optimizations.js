// Performance optimizations for VX School website

class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeScrolling();
        this.optimizeAnimations();
        this.optimizeImages();
        this.optimizeVideoPlayback();
        this.debounceResizeEvents();
    }

    // Optimize scrolling performance
    optimizeScrolling() {
        let ticking = false;

        function updateScrollEffects() {
            // Your scroll effects here
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        }

        // Use passive listeners for better performance
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // Optimize animations based on device capabilities
    optimizeAnimations() {
        // Detect if device prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // Disable heavy animations
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        }

        // Detect low-end devices
        const isLowEndDevice = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
        
        if (isLowEndDevice) {
            // Reduce animation complexity
            document.body.classList.add('low-performance');
        }
    }

    // Optimize images with lazy loading
    optimizeImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // Optimize video playback
    optimizeVideoPlayback() {
        const video = document.getElementById('bg-video');
        if (video) {
            // Pause video when not visible
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {}); // Ignore autoplay errors
                    } else {
                        video.pause();
                    }
                });
            });

            videoObserver.observe(video);

            // Reduce video quality on mobile
            if (window.innerWidth <= 768) {
                video.style.filter = 'brightness(0.25) saturate(1.1) blur(1px)';
            }
        }
    }

    // Debounce resize events
    debounceResizeEvents() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Handle resize
                this.handleResize();
            }, 150);
        }, { passive: true });
    }

    handleResize() {
        // Optimize for new viewport size
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile optimizations
            document.body.classList.add('mobile-optimized');
        } else {
            document.body.classList.remove('mobile-optimized');
        }
    }

    // Method to disable heavy effects temporarily
    disableHeavyEffects() {
        document.body.classList.add('performance-mode');
    }

    // Method to re-enable effects
    enableHeavyEffects() {
        document.body.classList.remove('performance-mode');
    }
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}