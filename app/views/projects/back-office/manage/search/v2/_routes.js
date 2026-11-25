const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { getSearchData } = require('../_search-data');

function renderSearchPage(req, res) {
  res.render('projects/back-office/manage/search/v2/index', {
    ...getSearchData(req, '/projects/back-office/manage/search/v2')
  });
}

router.get('/', renderSearchPage);
router.get('/index', renderSearchPage);

module.exports = router;
