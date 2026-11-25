document.querySelectorAll('[data-lpa-filter-search]').forEach((input) => {
  const optionsId = input.getAttribute('aria-controls');
  const options = optionsId ? document.getElementById(optionsId) : null;
  if (!options) return;

  const items = Array.from(options.querySelectorAll('[data-lpa-filter-option]'));
  const resultCount = document.getElementById(`${optionsId}-count`);
  const label = input.dataset.filterLabel || 'planning authorities';
  const prompt = input.dataset.filterPrompt || 'Enter an authority name to see matches';
  const updateOptions = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let matchCount = 0;

    items.forEach((item) => {
      const option = item.querySelector('input[type="checkbox"], input[type="radio"]');
      const matches = query
        ? item.textContent.toLocaleLowerCase().includes(query)
        : input.dataset.showAll === 'true';
      item.hidden = !matches && !option?.checked;
      if (matches) matchCount += 1;
    });

    if (resultCount) {
      resultCount.textContent = query
        ? `${matchCount} ${label} found`
        : prompt;
    }
  };

  updateOptions();
  input.addEventListener('input', () => {
    updateOptions();
  });
  options.addEventListener('change', updateOptions);
});
