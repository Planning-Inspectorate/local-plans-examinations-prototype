//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
  window.filterCheckboxes = function(input) {
    const filter = input.value.toLowerCase();
    const checkboxes = input.parentNode.querySelectorAll('.govuk-checkboxes__item');
    checkboxes.forEach(item => {
      const label = item.querySelector('label');
      if (label && label.textContent.toLowerCase().indexOf(filter) > -1) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  };
})