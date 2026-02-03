
Routing Overview

routes.js is the main entry point for all routes. 
It mounts feature routers from app/routes/: 

router.use('/', require('./routes/portal'));
router.use('/', require('./routes/local-plan-reps'));

Feature routers

Each file in app/routes/ handles one feature. 
Example: portal.js contains all /portal/... routes. 
Views

Templates live in app/features/<feature>/views/. 
Each page can have a folder for versions (v1.njk, v2.njk). 
Dynamic version switching

Use session data: 

const version = req.session.data['page-version'] || 'v1';
res.render(`features/<feature>/views/<page>/${version}`);

