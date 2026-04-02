document.addEventListener('DOMContentLoaded', function() {
  const nonConsecutiveLink = document.getElementById('non-consecutive-link');

  if (!nonConsecutiveLink) {
    return;
  }

  // Non-consecutive link behavior - navigate to Pattern A for individual dates
  nonConsecutiveLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/projects/back-office/manage/examination/hearing-dates-pattern-a.html';
  });
});
