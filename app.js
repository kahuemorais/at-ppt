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

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const switcher = btn.closest('.lang-switcher');
        const dropdown = switcher.querySelector('.lang-dropdown');
        document.querySelectorAll('.lang-dropdown').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
        });
        document.querySelectorAll('.lang-switcher').forEach(s => {
            if (s !== switcher) s.classList.remove('dropdown-open');
        });
        if (btn.classList.contains('globe-btn')) {
            switcher.classList.toggle('dropdown-open');
        }
    });
});

document.addEventListener('click', () => {
    document.querySelectorAll('.lang-dropdown').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.lang-switcher').forEach(s => s.classList.remove('dropdown-open'));
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
