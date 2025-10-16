// Settings Integration Script
// This script loads dynamic settings from the server and applies them to the frontend

class SettingsIntegration {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.applySettings();
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                this.settings = await response.json();
                console.log('Settings loaded:', this.settings); // Debug info
            } else {
                console.error('Failed to load settings, response:', response.status);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    applySettings() {
        // First reset everything to clean state
        this.resetToCleanState();
        this.applyPriceSettings();
        this.applyDiscountSettings();
        this.applyPackageAvailability();
        this.updateStickyPrice();
    }

    applyPriceSettings() {
        // Prices are set in resetToCleanState()
    }

    applyDiscountSettings() {
        if (this.settings.discountEnabled && this.settings.discountText) {
            // Use requestAnimationFrame for smooth rendering
            requestAnimationFrame(() => {
                this.showDiscountBanner();
                this.updatePricesWithDiscount();
                
                // Start timer if end date is set
                if (this.settings.discountEndDate) {
                    this.startDiscountTimer();
                }
            });
        }
    }

    resetToCleanState() {
        // Remove discount banner
        const existingBanner = document.querySelector('.discount-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Remove discount styles
        const existingStyles = document.querySelector('#discount-price-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        // Reset all pricing cards to original structure
        const pricingCards = document.querySelectorAll('[data-package]');
        pricingCards.forEach(card => {
            const priceDiv = card.querySelector('.price');
            if (priceDiv) {
                // Get original prices from settings or defaults
                const packageType = card.dataset.package;
                let originalPrice;
                
                if (packageType === 'basic') {
                    originalPrice = (this.settings && this.settings.basicPrice) || 10000;
                } else if (packageType === 'advanced') {
                    originalPrice = (this.settings && this.settings.advancedPrice) || 30000;
                } else if (packageType === 'paid-consultation') {
                    originalPrice = (this.settings && this.settings.paidConsultationPrice) || 'По договоренности';
                }
                
                if (originalPrice === 'По запросу' || originalPrice === 'По договоренности') {
                    priceDiv.innerHTML = originalPrice;
                } else if (originalPrice && !isNaN(originalPrice)) {
                    priceDiv.innerHTML = `<span class="price-amount">${originalPrice}</span> руб.`;
                }
            }
        });
    }

    resetPricesToOriginal() {
        // This function is now replaced by resetToCleanState
        this.resetToCleanState();
    }

    showDiscountBanner() {
        // Check if user has closed the banner
        const bannerClosed = localStorage.getItem('discountBannerClosed');
        if (bannerClosed === 'true') {
            return; // Don't show banner if user closed it
        }

        // Create discount banner with timer
        const banner = document.createElement('div');
        banner.className = 'discount-banner';
        banner.id = 'discountBanner';
        
        let timerHTML = '';
        if (this.settings.discountEndDate) {
            timerHTML = `
                <div class="discount-timer" id="discountTimer">
                    <div class="timer-label">До окончания акции:</div>
                    <div class="timer-display">
                        <div class="timer-unit">
                            <span class="timer-value" id="days">00</span>
                            <span class="timer-label-small">дней</span>
                        </div>
                        <div class="timer-separator">:</div>
                        <div class="timer-unit">
                            <span class="timer-value" id="hours">00</span>
                            <span class="timer-label-small">часов</span>
                        </div>
                        <div class="timer-separator">:</div>
                        <div class="timer-unit">
                            <span class="timer-value" id="minutes">00</span>
                            <span class="timer-label-small">минут</span>
                        </div>
                        <div class="timer-separator">:</div>
                        <div class="timer-unit">
                            <span class="timer-value" id="seconds">00</span>
                            <span class="timer-label-small">секунд</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        banner.innerHTML = `
            <div class="discount-content">
                <button class="discount-close" onclick="window.settingsIntegration.closeBanner()" aria-label="Закрыть">×</button>
                <div class="discount-text" id="discountText">${this.settings.discountText}</div>
                ${timerHTML}
            </div>
        `;

        // Add banner styles (improved design with close button)
        const styles = `
            <style>
            .discount-banner {
                background: linear-gradient(135deg, rgba(18, 20, 26, 0.95) 0%, rgba(15, 18, 24, 0.98) 100%);
                color: white;
                padding: 24px;
                text-align: center;
                font-weight: 600;
                margin: 32px auto;
                border-radius: 20px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                max-width: 1200px;
                position: relative;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.15);
                will-change: transform;
                transform: translateZ(0);
            }
            
            @keyframes gentle-glow {
                0%, 100% {
                    transform: translateZ(0) scale(1);
                }
                50% {
                    transform: translateZ(0) scale(1.01);
                }
            }
            
            .discount-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                position: relative;
            }
            
            .discount-close {
                position: absolute;
                top: -12px;
                right: -12px;
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .discount-close:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                border-color: rgba(255, 255, 255, 0.4);
            }
            
            .discount-text {
                font-size: 24px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                margin: 0;
            }
            
            .discount-timer {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            
            .timer-label {
                font-size: 16px;
                font-weight: 600;
                opacity: 0.9;
                margin: 0;
            }
            
            .timer-display {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.08);
                padding: 16px 24px;
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                will-change: transform;
                transform: translateZ(0);
            }
            
            .timer-unit {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 50px;
            }
            
            .timer-value {
                font-size: 28px;
                font-weight: 800;
                line-height: 1;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .timer-label-small {
                font-size: 12px;
                font-weight: 600;
                opacity: 0.8;
                margin-top: 4px;
            }
            
            .timer-separator {
                font-size: 24px;
                font-weight: 800;
                opacity: 0.7;
                animation: blink 1.5s ease-in-out infinite;
            }
            
            @keyframes blink {
                0%, 50% { opacity: 0.7; }
                51%, 100% { opacity: 0.3; }
            }
            
            @media (max-width: 768px) {
                .discount-banner {
                    padding: 20px 16px;
                    margin: 20px 16px;
                    border-radius: 16px;
                }
                
                .discount-content {
                    gap: 16px;
                }
                
                .discount-close {
                    top: -8px;
                    right: -8px;
                    width: 28px;
                    height: 28px;
                    font-size: 16px;
                }
                
                .discount-text {
                    font-size: 18px;
                    line-height: 1.3;
                }
                
                .timer-display {
                    padding: 12px 16px;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .timer-unit {
                    min-width: 40px;
                }
                
                .timer-value {
                    font-size: 22px;
                }
                
                .timer-label-small {
                    font-size: 10px;
                }
                
                .timer-separator {
                    font-size: 18px;
                    display: none; /* Hide separators on mobile for cleaner look */
                }
                
                .timer-label {
                    font-size: 14px;
                }
            }
            
            @media (max-width: 480px) {
                .discount-banner {
                    margin: 16px 12px;
                    padding: 16px 12px;
                }
                
                .discount-text {
                    font-size: 16px;
                }
                
                .timer-display {
                    padding: 10px 12px;
                    gap: 6px;
                }
                
                .timer-unit {
                    min-width: 35px;
                }
                
                .timer-value {
                    font-size: 20px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);

        // Insert banner after hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.insertAdjacentElement('afterend', banner);
        } else {
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    updatePricesWithDiscount() {
        if (!this.settings.discountPercent) return;

        // Remove existing discount styles first
        const existingStyles = document.querySelector('#discount-price-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        // Update prices in pricing cards
        const priceElements = document.querySelectorAll('.price');
        priceElements.forEach(priceDiv => {
            // Skip if already has discount container or is "По запросу"
            if (priceDiv.querySelector('.price-container') || priceDiv.textContent.includes('По запросу')) {
                return;
            }

            const priceAmountSpan = priceDiv.querySelector('.price-amount');
            if (priceAmountSpan) {
                const originalPrice = parseInt(priceAmountSpan.textContent.replace(/\D/g, ''));
                if (originalPrice) {
                    const discountedPrice = Math.round(originalPrice * (1 - this.settings.discountPercent / 100));

                    priceDiv.innerHTML = `
                        <div class="price-container">
                            <span class="original-price">${originalPrice} руб.</span>
                            <span class="discounted-price">${discountedPrice} руб.</span>
                            <span class="discount-badge">-${this.settings.discountPercent}%</span>
                        </div>
                    `;
                }
            }
        });

        // Add discount price styles
        const discountStyles = `
            <style id="discount-price-styles">
            .price-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                position: relative;
                padding: 8px;
                background: rgba(255, 107, 53, 0.08);
                border-radius: 8px;
                border: 1px solid rgba(255, 107, 53, 0.2);
            }
            
            .original-price {
                text-decoration: line-through;
                opacity: 0.6;
                font-size: 16px;
                color: #888;
                font-weight: 400;
            }
            
            .discounted-price {
                color: #ff6b35;
                font-weight: 800;
                font-size: 24px;
            }
            
            .discount-badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
            }
            
            /* Pricing card discount highlight */
            .pricing-card:has(.discount-badge) {
                border: 1px solid rgba(255, 107, 53, 0.4);
                box-shadow: 0 4px 20px rgba(255, 107, 53, 0.1);
            }
            
            @media (max-width: 768px) {
                .price-container {
                    padding: 6px;
                    gap: 3px;
                }
                
                .discount-badge {
                    position: static;
                    margin-top: 6px;
                    align-self: center;
                    font-size: 9px;
                    padding: 3px 6px;
                }
                
                .original-price {
                    font-size: 14px;
                }
                
                .discounted-price {
                    font-size: 18px;
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', discountStyles);
    }

    applyPackageAvailability() {
        const packages = {
            'basic': this.settings.basicAvailable,
            'advanced': this.settings.advancedAvailable,
            'consultation': this.settings.consultationAvailable,
            'paid-consultation': this.settings.paidConsultationAvailable
        };

        Object.entries(packages).forEach(([packageName, isAvailable]) => {
            const packageElement = document.querySelector(`[data-package="${packageName}"]`);
            if (packageElement) {
                if (!isAvailable) {
                    // Add unavailable overlay
                    this.addUnavailableOverlay(packageElement);
                } else {
                    // Remove unavailable overlay if exists
                    this.removeUnavailableOverlay(packageElement);
                }
            }
        });

        // Update tariff select options
        const tariffSelect = document.getElementById('tariff');
        if (tariffSelect) {
            const options = tariffSelect.querySelectorAll('option[data-package]');
            options.forEach(option => {
                const packageName = option.dataset.package;
                if (packages.hasOwnProperty(packageName)) {
                    if (!packages[packageName]) {
                        option.disabled = true;
                        option.textContent = option.textContent.replace(' (недоступно)', '') + ' (недоступно)';
                    } else {
                        option.disabled = false;
                        option.textContent = option.textContent.replace(' (недоступно)', '');
                    }
                }
            });
        }
    }

    addUnavailableOverlay(element) {
        // Remove existing overlay
        this.removeUnavailableOverlay(element);

        // Add unavailable class and overlay
        element.classList.add('package-unavailable');

        const overlay = document.createElement('div');
        overlay.className = 'unavailable-overlay';
        overlay.innerHTML = `
            <div class="unavailable-content">
                <span class="unavailable-icon">⏳</span>
                <span class="unavailable-text">Временно недоступен</span>
            </div>
        `;

        element.style.position = 'relative';
        element.appendChild(overlay);

        // Add styles if not already added
        if (!document.querySelector('#unavailable-styles')) {
            const styles = document.createElement('style');
            styles.id = 'unavailable-styles';
            styles.textContent = `
                .package-unavailable {
                    opacity: 0.7;
                    pointer-events: none;
                    filter: grayscale(0.5);
                }
                
                .unavailable-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: inherit;
                    z-index: 10;
                }
                
                .unavailable-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: white;
                    text-align: center;
                    padding: 20px;
                }
                
                .unavailable-icon {
                    font-size: 2em;
                    opacity: 0.8;
                }
                
                .unavailable-text {
                    font-weight: 600;
                    font-size: 1.1em;
                    letter-spacing: 0.5px;
                }
                
                @media (max-width: 768px) {
                    .unavailable-content {
                        padding: 15px;
                    }
                    
                    .unavailable-icon {
                        font-size: 1.5em;
                    }
                    
                    .unavailable-text {
                        font-size: 1em;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    removeUnavailableOverlay(element) {
        element.classList.remove('package-unavailable');
        const overlay = element.querySelector('.unavailable-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Method to refresh settings (can be called from admin panel)
    async refresh() {
        await this.loadSettings();
        this.applySettings();
    }

    // Update sticky CTA button price
    updateStickyPrice() {
        const stickyPriceElement = document.getElementById('sticky-price');
        if (!stickyPriceElement) return;

        // Get minimum price from available packages
        let minPrice = null;
        let minPriceText = '';

        // If settings are loaded, use them
        if (this.settings && Object.keys(this.settings).length > 0) {
            // Check basic price
            if (this.settings.basicAvailable !== false && this.settings.basicPrice) {
                const basicPrice = parseInt(this.settings.basicPrice);
                if (minPrice === null || basicPrice < minPrice) {
                    minPrice = basicPrice;
                    minPriceText = `от ${basicPrice.toLocaleString('ru-RU')} ₽`;
                }
            }

            // Check advanced price
            if (this.settings.advancedAvailable !== false && this.settings.advancedPrice) {
                const advancedPrice = parseInt(this.settings.advancedPrice);
                if (minPrice === null || advancedPrice < minPrice) {
                    minPrice = advancedPrice;
                    minPriceText = `от ${advancedPrice.toLocaleString('ru-RU')} ₽`;
                }
            }

            // Apply discount if enabled
            if (this.settings.discountEnabled && this.settings.discountPercent && minPrice) {
                const discountedPrice = Math.round(minPrice * (1 - this.settings.discountPercent / 100));
                minPriceText = `от ${discountedPrice.toLocaleString('ru-RU')} ₽`;
            }
        } else {
            // Fallback: get prices from DOM elements
            const priceElements = document.querySelectorAll('.price-amount');
            const prices = [];
            
            priceElements.forEach(element => {
                const priceText = element.textContent.replace(/\D/g, '');
                const price = parseInt(priceText);
                if (price && !isNaN(price)) {
                    prices.push(price);
                }
            });

            if (prices.length > 0) {
                minPrice = Math.min(...prices);
                minPriceText = `от ${minPrice.toLocaleString('ru-RU')} ₽`;
            } else {
                minPriceText = 'от 10 000 ₽'; // Default fallback
            }
        }

        // Update the sticky price
        if (minPriceText) {
            stickyPriceElement.textContent = minPriceText;
        }
    }

    // Method to force reload and reapply all settings
    async forceRefresh() {
        // Clear all existing modifications
        this.resetPricesToOriginal();

        // Remove discount banner
        const existingBanner = document.querySelector('.discount-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        // Clear timer if running
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Reload settings and reapply
        await this.loadSettings();
        this.applySettings();
    }

    // Discount timer methods
    startDiscountTimer() {
        if (!this.settings.discountEndDate) return;

        const endDate = new Date(this.settings.discountEndDate);
        
        // Update timer immediately
        this.updateTimer(endDate);
        
        // Update every second, but use requestAnimationFrame for better performance
        this.timerInterval = setInterval(() => {
            requestAnimationFrame(() => {
                this.updateTimer(endDate);
            });
        }, 1000);
    }

    updateTimer(endDate) {
        const now = new Date().getTime();
        const distance = endDate.getTime() - now;

        if (distance < 0) {
            // Timer expired
            this.onTimerExpired();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update display
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    onTimerExpired() {
        // Clear interval
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Hide discount banner
        const banner = document.getElementById('discountBanner');
        if (banner) {
            banner.style.display = 'none';
        }

        // Reset prices to original
        this.resetToCleanState();
        this.applyPriceSettings();
        this.applyPackageAvailability();
    }

    // Method to close banner and remember user's choice
    closeBanner() {
        const banner = document.getElementById('discountBanner');
        if (banner) {
            banner.remove();
        }
        
        // Remember that user closed the banner
        localStorage.setItem('discountBannerClosed', 'true');
        
        // Clear timer if running
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    // Method to reset banner state (for admin use)
    resetBannerState() {
        localStorage.removeItem('discountBannerClosed');
    }
}



// Initialize settings integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsIntegration = new SettingsIntegration();
    
    // Also update sticky price with default values if settings aren't loaded yet
    setTimeout(() => {
        if (window.settingsIntegration) {
            window.settingsIntegration.updateStickyPrice();
        }
    }, 1000);


});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsIntegration;
}