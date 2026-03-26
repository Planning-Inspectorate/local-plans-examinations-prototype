document.addEventListener('DOMContentLoaded', function() {
  const radios = document.querySelectorAll('input[name="hearingDurationType"]');
  const oneDaySection = document.getElementById('one-day-section');
  const consecutiveDaysSection = document.getElementById('consecutive-days-section');
  const nonConsecutiveLink = document.getElementById('non-consecutive-link');

  if (!radios.length || !oneDaySection || !consecutiveDaysSection || !nonConsecutiveLink) {
    return;
  }

  function updateVisibility() {
    const selected = document.querySelector('input[name="hearingDurationType"]:checked').value;
    
    if (selected === 'one-day') {
      oneDaySection.style.display = 'block';
      consecutiveDaysSection.style.display = 'none';
    } else {
      oneDaySection.style.display = 'none';
      consecutiveDaysSection.style.display = 'block';
    }
  }

  // Initial visibility
  updateVisibility();

  // Listen for radio changes
  radios.forEach(radio => {
    radio.addEventListener('change', updateVisibility);
  });

  // Non-consecutive link behavior - navigate to Pattern A for individual dates
  nonConsecutiveLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/projects/back-office/manage/examination/hearing-dates-pattern-a.html';
  });
});
