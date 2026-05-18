let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    localStorage.setItem('alpha-lang', lang);
}

document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});

document.addEventListener('click', (e) => {
    const details = document.querySelector('.lang-details');
    if (!details.contains(e.target)) {
        details.removeAttribute('open');
    }
});

const savedLang = localStorage.getItem('alpha-lang');
if (savedLang) {
    setLanguage(savedLang);
}

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        if (currentScroll > lastScroll) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
    } else {
        navbar.classList.remove('hidden');
    }
    
    lastScroll = currentScroll;
});

// Gold card video: reset when section leaves/enters viewport
const goldVideo = document.querySelector('video.vip-gold-video');
if (goldVideo) {
    // No loop, plays once and stops
    goldVideo.addEventListener('ended', () => {
        goldVideo.style.opacity = '1';
    });

    // Reset video when user leaves page/session
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            goldVideo.currentTime = 0;
            goldVideo.play().catch(() => {});
        }
    });

    // Reset when scrolling back into view
    const goldCard = document.querySelector('div.vip-card.vip-gold-card');
    if (goldCard) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    goldVideo.currentTime = 0;
                    goldVideo.play().catch(() => {});
                }
            });
        }, { threshold: 0.5 });
        observer.observe(goldCard);
    }
}
