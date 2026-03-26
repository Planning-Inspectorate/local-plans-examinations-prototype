document.addEventListener('DOMContentLoaded', function() {
  // Handle remove block buttons
  document.querySelectorAll('.remove-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const blockIndex = btn.dataset.blockIndex;
      const blockDiv = document.querySelector(`[data-block-index="${blockIndex}"]`);
      if (blockDiv) {
        blockDiv.remove();
        // Re-number remaining blocks
        document.querySelectorAll('.hearing-dates-block').forEach((block, idx) => {
          const heading = block.querySelector('.govuk-heading-s');
          heading.textContent = `Block ${idx + 1}`;
        });
      }
    });
  });

  // Handle "Add another set of dates" button
  const addAnotherBtn = document.querySelector('button[name="addAnother"]');
  if (addAnotherBtn) {
    addAnotherBtn.addEventListener('click', (e) => {
      // Allow form submission for "Add another" to work
      // No preventDefault needed - we want the form to submit
    });
  }
});
