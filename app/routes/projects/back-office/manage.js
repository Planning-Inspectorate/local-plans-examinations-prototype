const express = require('express');
const router = express.Router();

// Show delete confirmation page
router.get('/projects/back-office/manage/delete-case-confirmation.html', (req, res) => {
  res.render('projects/back-office/manage/delete-case-confirmation');
});

// Handle delete POST and show complete page
router.post('/projects/back-office/manage/delete-case-complete.html', (req, res) => {
  // Here you would implement soft delete logic, e.g. mark as deleted in DB or session
  res.render('projects/back-office/manage/delete-case-complete');
});

module.exports = router;
