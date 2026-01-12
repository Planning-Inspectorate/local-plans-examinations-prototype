

// app/routes/portal.js
const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Remove a document from the session's uploaded files
router.get('/projects/portal/document-category/with-documents/remove', function (req, res) {
  const fileName = req.query.name;

  // ensure session data object exists
  req.session.data = req.session.data || {};

  if (fileName && req.session.data['portal-upload-documents']) {
    req.session.data['portal-upload-documents'] =
      req.session.data['portal-upload-documents'].filter(f => f.name !== fileName);
  }

  res.redirect('/projects/portal/document-category/with-documents');
});

// Show upload documents page (new template)
router.get('/projects/portal/document-category/upload-documents', function (req, res) {
  res.render('/projects/portal/document-category/upload-documents-page');
});

// Show confirm document upload page with uploaded files
router.get('/projects/portal/document-category/confirm-document-upload', function (req, res) {
  req.session.data = req.session.data || {};
  const uploadedFiles = req.session.data['portal-upload-documents'] || [];
  res.render('/projects/portal/document-category/confirm-document-upload', { uploadedFiles });
});

// Handle document upload and redirect to confirm page
router.post('/projects/portal/document-category/upload-documents', function (req, res) {
  upload.array('upload-documents')(req, res, function (err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send(`Upload error: ${err.message}`);
    }

    try {
      req.session.data = req.session.data || {};

      if (!req.files || req.files.length === 0) {
        req.session.data['portal-upload-documents'] = [];
      } else {
        const fileInfo = req.files.map(file => ({
          name: file.originalname,
          size: Math.round(file.size / 1024) + 'KB'
        }));
        req.session.data['portal-upload-documents'] = fileInfo;
      }

      res.redirect('/projects/portal/document-category/with-documents');
    } catch (error) {
      console.error('Error in upload handler:', error);
      res.status(500).send(`Upload processing error: ${error.message}`);
    }
  });
});

// Portal: Email address page (GET shows form, POST goes to success)
router.get('/projects/portal/e-mail-address', function (req, res) {
  res.render('/projects/portal/e-mail-address');
});

router.post('/projects/portal/e-mail-address', function (req, res) {
  res.redirect('/projects/portal/enter-code-success');
});

// request new code
router.get('/projects/portal/request-new-code', function (req, res) {
  res.render('/projects/portal/request-new-code');
});

// sign-in success page after email submission
router.get('/projects/portal/enter-code-success', function (req, res) {
  res.render('/projects/portal/enter-code-success');
});

// optional POST handler for success page
router.post('/projects/portal/enter-code-success', function (req, res) {
  res.redirect('/projects/portal/tasklist');
});

// tasklist flow
router.post('/projects/portal/tasklist', function (req, res) {
  res.redirect('/projects/portal/document-category');
});

router.post('/projects/portal/document-category', function (req, res) {
  res.redirect('/projects/portal/document-category/document-type');
});

router.post('/projects/portal/document-category/document-type', function (req, res) {
  res.redirect('/projects/portal/document-category/upload-documents');
});

module.exports = router;
