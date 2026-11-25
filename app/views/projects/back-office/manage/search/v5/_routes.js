const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { getSearchData } = require('../_search-data');

function renderSearchPage(req, res) {
  for (const name of ['status', 'lpa', 'caseOfficer']) {
    const values = req.query[name];
    if (Array.isArray(values) && values.filter(value => value && value !== '_unchecked').length > 1) {
      return res.status(400).send(`Select only one ${name} filter.`);
    }
  }
  res.render('projects/back-office/manage/search/v5/index', {
    ...getSearchData(req, '/projects/back-office/manage/search/v5')
  });
}

router.get('/', renderSearchPage);
router.get('/index', renderSearchPage);

module.exports = router;
