document.addEventListener('DOMContentLoaded', () => {
  // Add error handling for the entire script
  try {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('form-status');
    const tariffInput = document.getElementById('tariff');

    if (form && statusEl) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());



        statusEl.textContent = 'Отправка...';
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
          const res = await fetch('/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            throw new Error(data.error || 'Ошибка отправки');
          }
          statusEl.textContent = 'Спасибо! Мы свяжемся с вами.';
          form.reset();
        } catch (err) {
          // Show specific error message from server or network error
          if (err.message && err.message !== 'Ошибка отправки') {
            statusEl.textContent = err.message;
          } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
            statusEl.textContent = 'Проблема с подключением к серверу. Проверьте интернет-соединение.';
          } else {
            statusEl.textContent = 'Не удалось отправить форму. Попробуйте позже.';
          }

        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    // Auto-add @ to Telegram field with validation
    const telegramInput = document.getElementById('telegram');
    if (telegramInput) {
      const handleTelegramInput = (e) => {
        if (!e?.target) return;

        let value = e.target.value || '';

        // Remove multiple @ symbols and keep only one at the start
        if (value.includes('@')) {
          value = '@' + value.replace(/@/g, '');
        }

        // Add @ if user types without it
        if (value && !value.startsWith('@')) {
          value = '@' + value;
        }

        e.target.value = value;

        // Real-time validation
        validateTelegramField(e.target);
      };

      const validateTelegramField = (input) => {
        const value = input?.value || '';
        const isValid = value.length === 0 || (value.length >= 6 && value.length <= 33 && /^@[a-zA-Z0-9_]{5,32}$/.test(value));

        if (value.length > 0 && !isValid) {
          input.style.borderBottomColor = '#ff6b6b';
          showFieldError(input, 'Telegram должен содержать 5-32 символа (буквы, цифры, _)');
        } else {
          input.style.borderBottomColor = '';
          hideFieldError(input);
        }
      };

      telegramInput.addEventListener('input', handleTelegramInput);
      telegramInput.addEventListener('blur', () => validateTelegramField(telegramInput));

      // Add @ when user starts typing
      telegramInput.addEventListener('keydown', (e) => {
        if (!e?.target?.value && e?.key?.length === 1 && e.key !== ' ') {
          setTimeout(() => handleTelegramInput(e), 0);
        }
      });
    }

    // Real-time validation for name field
    const nameInput = document.getElementById('name');
    if (nameInput) {
      const validateNameField = (input) => {
        const value = (input?.value || '').trim();
        const isValid = value.length === 0 || (value.length >= 2 && value.length <= 50 && /^[a-zA-Zа-яА-Я\s\-']+$/u.test(value));

        if (value.length > 0 && !isValid) {
          input.style.borderBottomColor = '#ff6b6b';
          showFieldError(input, 'Имя должно содержать 2-50 символов (только буквы)');
        } else {
          input.style.borderBottomColor = '';
          hideFieldError(input);
        }
      };

      nameInput.addEventListener('blur', () => validateNameField(nameInput));
    }

    // Helper functions for field validation
    function showFieldError(input, message) {
      if (!input?.parentNode) return;

      hideFieldError(input); // Remove existing error

      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = message || '';
      errorEl.style.cssText = 'color: #ff6b6b; font-size: 12px; margin-top: 4px;';

      input.parentNode.appendChild(errorEl);
    }

    function hideFieldError(input) {
      if (!input?.parentNode) return;

      const existingError = input.parentNode.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }
    }

    // Hero CTA button
    const heroCta = document.querySelector('.hero-cta-btn');
    if (heroCta) {
      heroCta.addEventListener('click', (e) => {
        e.preventDefault();
        const contact = document.getElementById('contact');
        if (contact) {
          contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Focus on name field after scroll
          setTimeout(() => {
            const nameField = document.getElementById('name');
            if (nameField) nameField.focus({ preventScroll: true });
          }, 800);
        }
      });
    }

    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

    if (mobileMenuBtn && mobileMenuOverlay) {
      // Open mobile menu
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      });

      // Close mobile menu
      const closeMobileMenu = () => {
        mobileMenuBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      };

      // Close button
      if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
      }

      // Close on overlay click
      mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
          closeMobileMenu();
        }
      });

      // Close on menu link click
      mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
          closeMobileMenu();
        });
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
          closeMobileMenu();
        }
      });
    }

    // Prefill tariff from pricing buttons
    document.querySelectorAll('.choose-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const tariff = btn.getAttribute('data-tariff') || '';
        if (tariffInput) tariffInput.value = tariff;
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const message = document.getElementById('message');
        if (message) message.focus({ preventScroll: true });
      });
    });

    // Reveal-on-scroll only (no active nav highlighting)
    const sections = Array.from(document.querySelectorAll('section'));
    const headerOffset = 80;

    const updateOnScroll = () => {
      // Reveal
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) sec.classList.add('reveal-in');
      });

      // no active-link calculation
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateOnScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateOnScroll();

    // Reviews carousel
    const carouselTrack = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const dotsContainer = document.getElementById('carousel-dots');

    if (carouselTrack && prevBtn && nextBtn && dotsContainer) {
      const reviews = carouselTrack.querySelectorAll('.review');
      let currentIndex = 0;
      let autoPlayInterval;

      // Create dots
      reviews.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
      });

      function updateCarousel() {
        const translateX = -currentIndex * 100;
        carouselTrack.style.transform = `translateX(${translateX}%)`;

        // Update dots
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
          dot.classList.toggle('active', index === currentIndex);
        });

        // Update buttons
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === reviews.length - 1;
      }

      function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, reviews.length - 1));
        updateCarousel();
      }

      function nextSlide() {
        if (currentIndex < reviews.length - 1) {
          currentIndex++;
          updateCarousel();
        }
      }

      function prevSlide() {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      }

      function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
          if (currentIndex === reviews.length - 1) {
            currentIndex = 0;
          } else {
            currentIndex++;
          }
          updateCarousel();
        }, 5000);
      }

      function stopAutoPlay() {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
        }
      }

      // Event listeners
      nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoPlay();
        startAutoPlay();
      });

      prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoPlay();
        startAutoPlay();
      });

      // Pause on hover
      carouselTrack.addEventListener('mouseenter', stopAutoPlay);
      carouselTrack.addEventListener('mouseleave', startAutoPlay);

      // Initialize
      updateCarousel();
      startAutoPlay();
    }

    // Student Tracks Audio Player
    const trackPlayers = document.querySelectorAll('.play-btn');
    let currentAudio = null;
    let currentButton = null;
    let progressInterval = null;

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function stopCurrentAudio() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      if (currentButton) {
        currentButton.classList.remove('playing', 'loading');
        currentButton.querySelector('.play-icon').style.display = 'block';
        currentButton.querySelector('.pause-icon').style.display = 'none';

        const card = currentButton.closest('.track-card');
        const progressFill = card.querySelector('.progress-fill');
        const currentTimeEl = card.querySelector('.current-time');
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
      }
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }

    trackPlayers.forEach(button => {
      button.addEventListener('click', () => {
        const trackId = button.getAttribute('data-track');
        const card = button.closest('.track-card');
        const progressFill = card.querySelector('.progress-fill');
        const currentTimeEl = card.querySelector('.current-time');
        const totalTimeEl = card.querySelector('.total-time');
        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');

        // If clicking the same button and it's playing, pause
        if (currentButton === button && currentAudio && !currentAudio.paused) {
          currentAudio.pause();
          button.classList.remove('playing');
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          return;
        }

        // If clicking the same button and it's paused, resume
        if (currentButton === button && currentAudio && currentAudio.paused) {
          currentAudio.play().catch(err => {
            alert('Не удалось воспроизвести трек. Проверьте, что файл существует.');
          });
          button.classList.add('playing');
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
          return;
        }

        // Stop current audio if playing different track
        stopCurrentAudio();

        // Show loading state
        button.classList.add('loading');

        // Create new audio
        currentAudio = new Audio(`/audio/${trackId}.mp3`);
        currentButton = button;

        // Set up audio event listeners
        currentAudio.addEventListener('loadedmetadata', () => {
          totalTimeEl.textContent = formatTime(currentAudio.duration);
        });

        currentAudio.addEventListener('canplay', () => {
          button.classList.remove('loading');
          button.classList.add('playing');
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';

          currentAudio.play().catch(err => {
            alert('Не удалось воспроизвести трек. Проверьте, что файл существует.');
            stopCurrentAudio();
          });
        });

        currentAudio.addEventListener('timeupdate', () => {
          if (currentAudio.duration) {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            currentTimeEl.textContent = formatTime(currentAudio.currentTime);
          }
        });

        currentAudio.addEventListener('ended', () => {
          stopCurrentAudio();
        });

        currentAudio.addEventListener('error', (e) => {
          button.classList.remove('loading');
          alert('Ошибка загрузки аудиофайла. Проверьте, что файл существует и доступен.');
          stopCurrentAudio();
        });

        // Load the audio
        currentAudio.load();
      });

      // Progress bar click to seek
      const progressBar = button.closest('.track-card').querySelector('.progress-bar');
      progressBar.addEventListener('click', (e) => {
        if (currentAudio && currentButton === button && currentAudio.duration) {
          const rect = progressBar.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = clickX / rect.width;
          currentAudio.currentTime = currentAudio.duration * percentage;
        }
      });
    });

    // FAQ Functionality
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const faqItem = question.closest('.faq-item');
        const isActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
          item.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!isActive) {
          faqItem.classList.add('active');
        }
      });
    });

    // Sticky Navigation
    const heroNav = document.getElementById('hero-nav');
    const heroSection = document.querySelector('.hero');

    if (heroNav && heroSection) {
      const handleStickyNav = () => {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY;

        if (scrollPosition >= heroBottom - 50) {
          heroNav.classList.add('sticky');
        } else {
          heroNav.classList.remove('sticky');
        }



        // Update active nav link
        updateActiveNavLink();
      };

      window.addEventListener('scroll', handleStickyNav);
      handleStickyNav(); // Check initial state
    }

    // Update active navigation link
    function updateActiveNavLink() {
      const sections = ['pricing', 'teachers', 'reviews', 'tracks', 'contact'];
      const navLinks = document.querySelectorAll('.nav-desktop a, .mobile-menu-link');

      let activeSection = '';

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            activeSection = sectionId;
            break;
          }
        }
      }

      // Update active state
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${activeSection}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    // Sticky CTA Button
    const stickyCta = document.getElementById('sticky-cta');

    if (stickyCta && heroSection) {
      const showStickyButton = () => {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY;

        if (scrollPosition > heroBottom) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
      };

      window.addEventListener('scroll', showStickyButton);
      showStickyButton(); // Check initial state
    }



    // Update navigation to include FAQ
    const nav = document.querySelector('.nav');
    if (nav) {
      const faqLink = nav.querySelector('a[href="#contact"]');
      if (faqLink) {
        faqLink.insertAdjacentHTML('beforebegin', '<a href="#faq">ВОПРОСЫ</a>');
      }
    }

  } catch (error) {
    console.error('Script initialization error:', error);
  }
});


