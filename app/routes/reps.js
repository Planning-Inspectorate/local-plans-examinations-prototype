
const express = require('express');
const router = express.Router();

// Comment on a local plan representation journey

  // Start page
router.get('/local-plan-representations/start', function (req, res) {
  res.render('local-plan-representations/start');
});

 // Who are you representing?

router.post('/local-plan-representations/who-are-you-representing', function (req, res) {
  const choice = req.body['examination-submitting-for'];

 
  req.session.data['examination-submitting-for'] = choice;

  if (choice === 'myself') {
    res.redirect('/local-plan-representations/name');
  } else if (choice === 'another') {
    res.redirect('/local-plan-representations/agent-person');
  } else if (choice === 'organisation') {
    res.redirect('/local-plan-representations/agent');
  }
});


// Myself



 // What is your name?
router.post('/local-plan-representations/name', function (req, res) {
 
  req.session.data['interested-first-name'] = req.body['interested-first-name'];
  req.session.data['interested-last-name'] = req.body['interested-last-name'];

 
  res.redirect('/local-plan-representations/email-address');
});


 // What is your email address?

router.post('/local-plan-representations/email', function (req, res) {
  req.session.data['email-address'] = req.body['email-address'];
  res.redirect('/local-plan-representations/address');
});


// What is your address?
router.post('/local-plan-representations/address', function (req, res) {
  req.session.data['address-line-1'] = req.body['address-line-1'];
  req.session.data['address-line-2'] = req.body['address-line-2'];
  req.session.data['town'] = req.body['town'];
  req.session.data['county'] = req.body['county'];
  req.session.data['postcode'] = req.body['postcode'];
  res.redirect('/local-plan-representations/part-of-plan');
});


// Another person

// Are you acting as an agent on behalf of a client?
router.post('/local-plan-representations/agent-person', function (req, res) {
  req.session.data['agent-person'] = req.body['agent-person'];
  
  if (req.body['agent-person'] === 'Yes') {
    res.redirect('/local-plan-representations/organisation-name-another-person');
  } else {
    res.redirect('/local-plan-representations/email-rep-not-agent-person'); 
  }
});

// What is the name of the organisation you work for? **** this section seems to be problematic ****
router.post('/local-plan-representations/organisation-name-another-person', function (req, res) {
  req.session.data['organisation-name-another-person'] = req.body['organisation-name-another-person'];
  res.redirect('/local-plan-representations/email-rep-person');
});

// What is your email address?
router.post('/local-plan-representations/email-rep-person', function (req, res) {
  req.session.data['email-rep-person'] = req.body['email-rep-person'];
  res.redirect('/local-plan-representations/person-representing');
});

// What is your email address? (non-agent)
router.post('/local-plan-representations/email-rep-not-agent-person', function (req, res) {
  req.session.data['email-rep-not-agent-person'] = req.body['email-rep-not-agent-person'];
  res.redirect('/local-plan-representations/person-representing');
}); 

// What is the name of the person you are representing?   
router.post('/local-plan-representations/person-representing', function (req, res) {
  req.session.data['person-first-name'] = req.body['person-first-name'];
  req.session.data['person-last-name'] = req.body['person-last-name'];
  res.redirect('/local-plan-representations/part-of-plan');
});



// Organisation or charity

// Are you acting as an agent on behalf of a client?
router.post('/local-plan-representations/agent', function (req, res) {
  req.session.data['agent'] = req.body['agent'];
  
  if (req.body['agent-person'] === 'Yes') {
    res.redirect('/local-plan-representations/name-of-organisation');
  } else {
    res.redirect('/local-plan-representations/email-rep-not-agent-organisation'); 
  }
});

// What is the name of the organisation you work for?
router.post('/local-plan-representations/name-of-organisation', function (req, res) {
  req.session.data['name-of-organisation'] = req.body['name-of-organisation'];
  res.redirect('/local-plan-representations/email-rep-organisation');
});

// What is your email address?
router.post('/local-plan-representations/email-rep-organisation', function (req, res) {
  req.session.data['email-rep-organisation'] = req.body['email-rep-organisation'];
  res.redirect('/local-plan-representations/organisation-representing');
});

// What is your email address? (non-agent)
router.post('/local-plan-representations/email-rep-not-agent-organisation', function (req, res) {
  req.session.data['email-rep-not-agent-organisation'] = req.body['email-rep-not-agent-organisation'];
  res.redirect('/local-plan-representations/organisation-representing');
}); 

// What is the full name of the organisation or charity that you are representing?
router.post('/local-plan-representations/organisation-representing', function (req, res) {
  req.session.data['organisation-representing'] = req.body['organisation-representing'];
  res.redirect('/local-plan-representations/part-of-plan');
}); 


// Representation comments journey

// Which part of the plan are you commenting on?
router.post('/local-plan-representations/plan-part', function (req, res) {
  req.session.data['paragraph'] = req.body['paragraph'];
  req.session.data['policy'] = req.body['policy'];
  req.session.data['policy-map'] = req.body['policy-map'];
  res.redirect('/local-plan-representations/soundness'); 
});


// Is the plan sound?
router.post('/local-plan-representations/soundness', function (req, res) {
  req.session.data['soundness'] = req.body['soundness'];
  res.redirect('/local-plan-representations/legally-compliant'); 
});

// Is the plan legally compliant?
router.post('/local-plan-representations/legally-compliant', function (req, res) {
  req.session.data['legally-compliant'] = req.body['legally-compliant'];
  res.redirect('/local-plan-representations/duty-to-cooperate'); 
});

// Does the plan meet the duty to cooperate?
router.post('/local-plan-representations/duty-to-cooperate', function (req, res) {
  req.session.data['duty-to-cooperate'] = req.body['duty-to-cooperate'];
  res.redirect('/local-plan-representations/add-your-comment'); 
});

// What is your comment on this part of the plan?
router.post('/local-plan-representations/comment', function (req, res) {
  req.session.data['comment'] = req.body['comment'];
  res.redirect('/local-plan-representations/upload-files-to-support-comment'); 
});

// Do you want to upload documents to support your comment?
router.post('/local-plan-representations/documents-check', function (req, res) {
  req.session.data['wants-to-upload-documents'] = req.body['wants-to-upload-documents'];

  if (req.body['wants-to-upload-documents'] === 'Yes') {
    res.redirect('/document-category/upload-documents');
  } else {
    res.redirect('/local-plan-representations/modifications'); 
  }
});

// Document upload handler
router.post('/document-category/upload-documents', function(req, res, next) {
  console.log('\n=== Upload Request Received ===');
  console.log('Headers:', req.headers);
  console.log('Body before multer:', req.body);
  console.log('Files before multer:', req.files);
  console.log('===========================\n');

  upload.array('upload-documents')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send(`Upload error: ${err.message}`);
    }

    console.log('\n=== After Multer Processing ===');
    console.log('Files processed:', req.files);
    console.log('============================\n');

    try {
      if (!req.files || req.files.length === 0) {
        console.warn('No files in request after multer processing');
        req.session.data['upload-documents'] = [];
      } else {
        const fileInfo = req.files.map(file => ({
          name: file.originalname,
          size: Math.round(file.size / 1024) + 'KB'
        }));
        
        console.log('Saving to session:', fileInfo);
        req.session.data['upload-documents'] = fileInfo;
        
        // Force session save
        req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          else console.log('Session saved successfully');
        });
      }

      res.redirect('/local-plan-representations/modifications');
    } catch (error) {
      console.error('Error in upload handler:', error);
      res.status(500).send(`Upload processing error: ${error.message}`);
    }
  });
});



// What changes would make this part of the plan legally compliant and sound?

router.post('/local-plan-representations/comments-mod', function (req, res) {
  req.session.data['comments-mod'] = req.body['comments-mod'];
  res.redirect('/local-plan-representations/upload-files-to-support-modifications'); 
});


// Do you want to upload documents to support your suggested changes?
router.post('/local-plan-representations/documents-mod', function (req, res) {
  req.session.data['wants-to-upload-documents-mod'] = req.body['wants-to-upload-documents-mod'];

  if (req.body['wants-to-upload-documents-mod'] === 'Yes') {
    res.redirect('/local-plan-representations/mod-document-category/upload-documents');
  } else {
    res.redirect('/local-plan-representations/hearings'); 
  }
});

// Document upload for modifications
router.post('/local-plan-representations/mod-document-category/upload-documents', function(req, res, next) {
  console.log('\n=== Modifications Upload Request Received ===');
  console.log('Headers:', req.headers);
  console.log('Body before multer:', req.body);
  console.log('Files before multer:', req.files);
  console.log('===========================\n');

  upload.array('upload-documents-mod')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send(`Upload error: ${err.message}`);
    }

    console.log('\n=== After Multer Processing ===');
    console.log('Files processed:', req.files);
    console.log('============================\n');

    try {
      if (!req.files || req.files.length === 0) {
        console.warn('No files in request after multer processing');
        req.session.data['upload-documents-mod'] = [];
      } else {
        const fileInfo = req.files.map(file => ({
          name: file.originalname,
          size: Math.round(file.size / 1024) + 'KB'
        }));
        
        console.log('Saving to session:', fileInfo);
        req.session.data['upload-documents-mod'] = fileInfo;
        
        // Force session save
        req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          else console.log('Session saved successfully');
        });
      }

      res.redirect('/local-plan-representations/hearings');
    } catch (error) {
      console.error('Error in upload handler:', error);
      res.status(500).send(`Upload processing error: ${error.message}`);
    }
  });
});

// Do you want to take part in the hearing sessions for this suggested change?
router.post('/local-plan-representations/hearing', function (req, res) {
  req.session.data['hearing'] = req.body['hearing'];

  if (req.body['hearing'] === 'Yes') {
    res.redirect('/local-plan-representations/hearing-participation-comment');
  } else {
    res.redirect('/local-plan-representations/add-another-comment'); 
  }
});

// Why do you want to take part in the hearing sessions for this suggested change?

router.post('/local-plan-representations/comment-hearing', function (req, res) {
  req.session.data['comment-hearing'] = req.body['comment-hearing'];
  res.redirect('/local-plan-representations/add-another-comment'); 
});

// Do you want to comment on another part of the plan?
router.post('/local-plan-representations/add-another-comment', function (req, res) {
  req.session.data['add-another-comment'] = req.body['add-another-comment'];

  if (req.body['add-another-comment'] === 'Yes') {
    // Increment the comment count or initialize it
    const currentCount = req.session.data['number-of-comments'] || 1;
    req.session.data['number-of-comments'] = currentCount + 1;
    
    // Clone the personal details to the new comment's data
    const newIndex = currentCount;
    
    // Copy just the section-specific data to new indexed versions
    const fieldsToReset = [
      'paragraph', 'policy', 'policy-map', 'soundness', 'legally-compliant', 
      'duty-to-cooperate', 'comment', 'comments-mod', 'hearing', 'comment-hearing'
    ];
    
    fieldsToReset.forEach(field => {
      // Save the current comment's data with an index
      if (req.session.data[field]) {
        req.session.data[`${field}-${newIndex - 1}`] = req.session.data[field];
        // Clear the base field for the next comment
        req.session.data[field] = '';
      }
    });

    // Handle file uploads for the previous comment
    if (req.session.data['upload-documents']) {
      req.session.data[`upload-documents-${newIndex - 1}`] = req.session.data['upload-documents'];
      req.session.data['upload-documents'] = [];
    }
    if (req.session.data['upload-documents-mod']) {
      req.session.data[`upload-documents-mod-${newIndex - 1}`] = req.session.data['upload-documents-mod'];
      req.session.data['upload-documents-mod'] = [];
    }

    res.redirect('/local-plan-representations/part-of-plan');
  } else {
    // If this is the last comment, save its data with an index
    const currentCount = req.session.data['number-of-comments'] || 1;
    const lastIndex = currentCount - 1;
    
    const fieldsToSave = [
      'paragraph', 'policy', 'policy-map', 'soundness', 'legally-compliant', 
      'duty-to-cooperate', 'comment', 'comments-mod', 'hearing', 'comment-hearing'
    ];
    
    fieldsToSave.forEach(field => {
      if (req.session.data[field]) {
        req.session.data[`${field}-${lastIndex}`] = req.session.data[field];
      }
    });

    // Handle file uploads for the last comment
    if (req.session.data['upload-documents']) {
      req.session.data[`upload-documents-${lastIndex}`] = req.session.data['upload-documents'];
    }
    if (req.session.data['upload-documents-mod']) {
      req.session.data[`upload-documents-mod-${lastIndex}`] = req.session.data['upload-documents-mod'];
    }

    res.redirect('/local-plan-representations/multiple-answers');
  }
});


// Check your answers
router.post('/local-plan-representations/answers', function (req, res) {
  res.redirect('/local-plan-representations/declaration');
});

// Declaration
router.post('/local-plan-representations/declaration', function (req, res) {
  res.redirect('/local-plan-representations/representation-submitted');
});

module.exports = router;