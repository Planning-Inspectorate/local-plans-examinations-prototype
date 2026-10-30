
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

Plan outcome and pause persistence

The create-case load-case routes save the outgoing plan's outcome, pause history,
pause draft, withdrawal evidence and examination status in the matching case's
examinationOutcomeAndPause object before clearing manage fields. They then restore
the selected plan's values, clearing any previous values from session.data too.
This keeps the data separate by caseRef within the prototype session; clearing
the session still clears the saved cases. Shared logic lives in
projects/back-office/examination-case-state.js.

Run the case-switching regression tests from the project root:
node --test test/examination-case-state.test.js

Examination v6 pause start and restart dates require a complete, real calendar date with a
four-digit year. Invalid entries retain form values and show an error without
changing the current pause, new-pause draft or historical pause.
Run the pause-date regression tests:
node --test test/plan-pause-date.test.js
