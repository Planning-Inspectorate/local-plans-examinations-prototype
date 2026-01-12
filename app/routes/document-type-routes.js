// Route for document type selection
router.get('/document-category/document-type', function(req, res) {
  res.render('document-category/document-type');
});

router.post('/document-category/document-type', function(req, res) {
  // Save the selected document type to session if needed
  req.session.data['document-type'] = req.body['document-type'];
  // Redirect to upload documents page
  res.redirect('/document-category/upload-documents');
});
