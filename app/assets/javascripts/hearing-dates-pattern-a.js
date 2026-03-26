document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.hearing-dates-container');
  const addButton = document.getElementById('add-day-button');
  let dayCount = 1;

  if (!addButton || !container) {
    return;
  }

  addButton.addEventListener('click', function(e) {
    e.preventDefault();
    dayCount++;
    const newDayHTML = `
      <div class="hearing-date-item" data-day="${dayCount}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 class="govuk-heading-s" style="margin-bottom: 0;">Day ${dayCount}</h3>
          <a href="#" class="govuk-link remove-day-link" data-day="${dayCount}">Remove</a>
        </div>
        <div class="govuk-form-group">
          <fieldset class="govuk-fieldset">
            <legend class="govuk-visually-hidden">Date</legend>
            <div class="govuk-date-input" id="hearing-date-day-${dayCount}">
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="hearing-date-day-${dayCount}-day">Day</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-2" id="hearing-date-day-${dayCount}-day" name="hearingDates[${dayCount - 1}][day]" type="text" autocomplete="off" inputmode="numeric">
                </div>
              </div>
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="hearing-date-day-${dayCount}-month">Month</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-2" id="hearing-date-day-${dayCount}-month" name="hearingDates[${dayCount - 1}][month]" type="text" autocomplete="off" inputmode="numeric">
                </div>
              </div>
              <div class="govuk-date-input__item">
                <div class="govuk-form-group">
                  <label class="govuk-label govuk-date-input__label" for="hearing-date-day-${dayCount}-year">Year</label>
                  <input class="govuk-input govuk-date-input__input govuk-input--width-4" id="hearing-date-day-${dayCount}-year" name="hearingDates[${dayCount - 1}][year]" type="text" autocomplete="off" inputmode="numeric">
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', newDayHTML);
    attachRemoveListener(dayCount);
  });

  function attachRemoveListener(day) {
    const removeLink = document.querySelector(`[data-remove-day="${day}"]`) || document.querySelector(`a[data-day="${day}"]`);
    if (removeLink) {
      removeLink.addEventListener('click', function(e) {
        e.preventDefault();
        const item = document.querySelector(`.hearing-date-item[data-day="${day}"]`);
        if (item) {
          item.remove();
        }
      });
    }
  }

  // Attach listeners to initial remove links
  document.querySelectorAll('.remove-day-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const day = this.getAttribute('data-day');
      const item = document.querySelector(`.hearing-date-item[data-day="${day}"]`);
      if (item) {
        item.remove();
      }
    });
  });
});
