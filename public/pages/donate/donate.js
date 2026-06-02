document.querySelectorAll('.donate-block').forEach(block => {
    const expanded = block.querySelector('.donate-expanded');
    const closeBtn = block.querySelector('.donate-close-big');

    block.addEventListener('click', () => {

        if (block.classList.contains('reveal-start')) return;

        const rect = block.getBoundingClientRect();

        block.style.setProperty('--start-top', rect.top + 'px');
        block.style.setProperty('--start-left', rect.left + 'px');
        block.style.setProperty('--start-width', rect.width + 'px');
        block.style.setProperty('--start-height', rect.height + 'px');

        block.classList.add('reveal-start');

        setTimeout(() => block.classList.add('reveal-full'), 10);

        setTimeout(() => {
            expanded.classList.add('show');
        }, 300);
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        expanded.classList.remove('show');
        block.classList.remove('reveal-full');

        setTimeout(() => {
            block.classList.remove('reveal-start');
        }, 350);
    });
});
