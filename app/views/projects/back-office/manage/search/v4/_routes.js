const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { getSearchData, getRequestedPageSize } = require('../_search-data');

function renderSearchPage(req, res) {
  const pageSize = getRequestedPageSize(req.query.pageSize);
  if (pageSize === null) {
    return res.status(400).send('Results per page must be 25, 50 or 100.');
  }

  res.render('projects/back-office/manage/search/v4/index', {
    ...getSearchData(req, '/projects/back-office/manage/search/v4', { pageSize })
  });
}

router.get('/', renderSearchPage);
router.get('/index', renderSearchPage);

module.exports = router;
