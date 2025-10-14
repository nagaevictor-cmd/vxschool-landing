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
            this.showDiscountBanner();
            this.updatePricesWithDiscount();
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
                    originalPrice = this.settings.basicPrice || 10000;
                } else if (packageType === 'group') {
                    originalPrice = this.settings.groupPrice || 30000;
                } else if (packageType === 'individual') {
                    originalPrice = this.settings.individualPrice || 'По запросу';
                }
                
                if (originalPrice === 'По запросу') {
                    priceDiv.innerHTML = originalPrice;
                } else {
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
        // Create discount banner
        const banner = document.createElement('div');
        banner.className = 'discount-banner';
        banner.innerHTML = `
            <div class="discount-content">
                <div class="discount-info">
                    <span class="discount-icon">✨</span>
                    <span class="discount-text">${this.settings.discountText}</span>
                </div>
                <button class="discount-close" onclick="this.parentElement.parentElement.remove()" aria-label="Закрыть">×</button>
            </div>
        `;

        // Add banner styles
        const styles = `
            <style>
            .discount-banner {
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                color: white;
                padding: 18px 0;
                text-align: center;
                font-weight: 600;
                margin: 25px auto;
                border-radius: 15px;
                box-shadow: 0 6px 25px rgba(255, 107, 53, 0.25);
                max-width: 1200px;
                position: relative;
                overflow: hidden;
            }
            
            .discount-banner::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
                animation: shine 4s infinite;
            }
            
            .discount-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 30px;
                position: relative;
                z-index: 2;
            }
            
            .discount-info {
                display: flex;
                align-items: center;
                gap: 15px;
                flex: 1;
                justify-content: center;
            }
            
            .discount-icon {
                font-size: 1.5em;
                animation: gentle-pulse 3s ease-in-out infinite;
            }
            
            .discount-text {
                font-size: 1.2em;
                letter-spacing: 0.3px;
                font-weight: 600;
            }
            
            .discount-close {
                background: rgba(255, 255, 255, 0.15);
                border: none;
                color: white;
                font-size: 1.3em;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 50%;
                transition: all 0.2s ease;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .discount-close:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: rotate(90deg);
            }
            
            @keyframes shine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            @keyframes gentle-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
            
            @media (max-width: 768px) {
                .discount-banner {
                    margin: 20px 15px;
                    border-radius: 12px;
                    padding: 16px 0;
                }
                
                .discount-content {
                    padding: 0 20px;
                }
                
                .discount-text {
                    font-size: 1.1em;
                }
                
                .discount-icon {
                    font-size: 1.3em;
                }
                
                .discount-close {
                    width: 36px;
                    height: 36px;
                    font-size: 1.2em;
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
            'group': this.settings.groupAvailable,
            'individual': this.settings.individualAvailable,
            'consultation': this.settings.consultationAvailable
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

            // Check group price
            if (this.settings.groupAvailable !== false && this.settings.groupPrice) {
                const groupPrice = parseInt(this.settings.groupPrice);
                if (minPrice === null || groupPrice < minPrice) {
                    minPrice = groupPrice;
                    minPriceText = `от ${groupPrice.toLocaleString('ru-RU')} ₽`;
                }
            }

            // If individual is available and others aren't, show "По запросу"
            if (this.settings.individualAvailable !== false && minPrice === null) {
                minPriceText = 'По запросу';
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

        // Reload settings and reapply
        await this.loadSettings();
        this.applySettings();
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