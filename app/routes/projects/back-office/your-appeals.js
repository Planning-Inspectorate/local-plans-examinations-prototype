const _ = require('lodash')
const Pagination = require('../helpers/pagination')
const { getActions } = require('../helpers/actions')
const { isChildAppeal, isLeadAppeal } = require('../helpers/linked-appeals')
const { allStatuses } = require('../data/statuses')
const caseOfficers = require('../data/case-officers')
const types = require('../data/types')

module.exports = router => {

  router.get('/main/your-appeals', function (req, res) {

    let appeals = req.session.data.appeals
      .filter(appeal => appeal.caseOfficer?.name == 'Tony Stark')
      .map(appeal => ({
        ...appeal,
        actions: getActions(appeal),
        isLeadAppeal: isLeadAppeal(appeal.id, req.session.data.linkedAppeals),
        isChildAppeal: isChildAppeal(appeal.id, req.session.data.linkedAppeals)
      }));

    if(req.session.data.sort == 'Status') {
      // Sort by status
      appeals = appeals.sort((a, b) => {
        return allStatuses.indexOf(a.status) - allStatuses.indexOf(b.status);
      })
    } else {
      // Sort by due date
      const now = new Date()

      appeals = appeals.sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate) : null;
        const bDue = b.dueDate ? new Date(b.dueDate) : null;
      
        if (!aDue && !bDue) return 0;        // both have no due date
        if (!aDue) return 1;                 // a has no due date, b does => a goes after
        if (!bDue) return -1;                // b has no due date, a does => b goes after
      
        // both have due dates — sort by proximity to now
        return Math.abs(aDue - now) - Math.abs(bDue - now);
      });
    }

    let keywords = _.get(req.session.data.search, 'keywords')

    if(keywords) {
      keywords = keywords.toLowerCase()
      appeals = appeals.filter(appeal => {
        let reference = appeal.id
        let planningApplicationReference = appeal.planningApplicationReference
        let name = (appeal.appellant.firstName + ' ' + appeal.appellant.lastName).toLowerCase()
        let postcode = appeal.site.address.postcode.toLowerCase()
        return postcode.indexOf(keywords) > -1 || reference.indexOf(keywords) > -1 || name.indexOf(keywords) > -1 || planningApplicationReference.indexOf(keywords) > -1
      })
    }

    let selectedInspectorFilters = _.get(req.session.data.filters, 'inspectors')
    let selectedLPAFilters = _.get(req.session.data.filters, 'lpas')
    let selectedStatusFilters = _.get(req.session.data.filters, 'statuses')
    let selectedProcedureFilters = _.get(req.session.data.filters, 'procedures')
    let selectedTypeFilters = _.get(req.session.data.filters, 'types')
    let selectedLinkedAppealTypeFilters = _.get(req.session.data.filters, 'linkedAppealTypes')
    let selectedSiteVisitFilters = _.get(req.session.data.filters, 'siteVisit')
    let selectedPlanningObligationFilters = _.get(req.session.data.filters, 'planningObligation')
    let hasFilters = _.get(selectedInspectorFilters, 'length') || _.get(selectedLPAFilters, 'length') || _.get(selectedStatusFilters, 'length') || _.get(selectedProcedureFilters, 'length') || _.get(selectedLinkedAppealTypeFilters, 'length') || _.get(selectedTypeFilters, 'length') || _.get(selectedSiteVisitFilters, 'length') || _.get(selectedPlanningObligationFilters, 'length')

    let selectedFilters = {
      categories: []
    }

    // the user has selected a status filter
    if(hasFilters) {
      appeals = appeals.filter(appeal => {
        let matchesStatus = true
        let matchesInspector = true
        let matchesLPA = true
        let matchesType = true
        let matchesProcedure = true
        let matchesLinkedAppealType = true
        let matchesSiteVisit = true
        let matchesPlanningObligation = true

        if(_.get(selectedStatusFilters, 'length')) {
          matchesStatus = selectedStatusFilters.includes(appeal.status);
        }
        
        if(_.get(selectedLPAFilters, 'length')) {
          matchesLPA = selectedLPAFilters.includes(appeal.lpa.name);
        }

        if(_.get(selectedInspectorFilters, 'length')) {
          matchesInspector = false
          if(selectedInspectorFilters.includes('Unassigned') && !appeal.inspector) {
            matchesInspector = true
          } 
          if(selectedInspectorFilters.includes(appeal.inspector)) {
            matchesInspector = true
          }
        }

        if(_.get(selectedTypeFilters, 'length')) {
          matchesType = selectedTypeFilters.includes(appeal.type);
        }

        if(_.get(selectedProcedureFilters, 'length')) {
          matchesProcedure = selectedProcedureFilters.includes(appeal.procedure);
        }

        if(_.get(selectedLinkedAppealTypeFilters, 'length')) {
          matchesLinkedAppealType = false

          if(selectedLinkedAppealTypeFilters.includes('Lead') && appeal.isLeadAppeal) {
            matchesLinkedAppealType = true
          }

          if(selectedLinkedAppealTypeFilters.includes('Child') && appeal.isChildAppeal) {
            matchesLinkedAppealType = true
          }

          if(selectedLinkedAppealTypeFilters.includes('Not linked') && !appeal.isLeadAppeal && !appeal.isChildAppeal) {
            matchesLinkedAppealType = true
          }
        }

        if(_.get(selectedSiteVisitFilters, 'length')) {
          matchesSiteVisit = false
          if(selectedSiteVisitFilters.includes('Site visit set up')) {
            if(appeal.siteVisit) {
              matchesSiteVisit = true
            }
          }
          if(selectedSiteVisitFilters.includes('Site visit not set up')) {
            if(!appeal.siteVisit) {
              matchesSiteVisit = true
            }
          }
        }

        if(_.get(selectedPlanningObligationFilters, 'length')) {
          matchesPlanningObligation = false
          if(selectedPlanningObligationFilters.includes('Has planning obligation')) {
            if(appeal.appealForm.hasPlanningObligation == 'Yes') {
              matchesPlanningObligation = true
            }
          }
          if(selectedPlanningObligationFilters.includes('Does not have planning obligation')) {
            if(appeal.appealForm.hasPlanningObligation == 'No') {
              matchesPlanningObligation = true
            }
          }
        }

        return matchesInspector && matchesLPA && matchesStatus && matchesType && matchesProcedure && matchesLinkedAppealType && matchesSiteVisit && matchesPlanningObligation
      })
    }

    let selectedInspectorItems
    let selectedLPAItems
    let selectedStatusItems

    if(_.get(selectedStatusFilters, 'length')) {
      selectedStatusItems = selectedStatusFilters.map(label => {
        return {
          text: label,
          href: `/main/your-appeals/remove-status/${label}`
        }
      })

      selectedFilters.categories.push({
        heading: { text: 'Status' },
        items: selectedStatusItems
      })
    }

    if(_.get(selectedInspectorFilters, 'length')) {

      selectedInspectorItems = selectedInspectorFilters.map(label => {
        return {
          text: label,
          href: `/main/your-appeals/remove-inspector/${label}`
        }
      })


      selectedFilters.categories.push({
        heading: { text: 'Inspector' },
        items: selectedInspectorItems
      })
    }

    if(_.get(selectedLPAFilters, 'length')) {

      selectedLPAItems = selectedLPAFilters.map(label => {
        return {
          text: label,
          href: `/main/your-appeals/remove-lpa/${label}`
        }
      })

      selectedFilters.categories.push({
        heading: { text: 'Local planning authority' },
        items: selectedLPAItems
      })
    }

    if(_.get(selectedTypeFilters, 'length')) {
      selectedFilters.categories.push({
        heading: { text: 'Type' },
        items: selectedTypeFilters.map(label => {
          return {
            text: label,
            href: `/main/your-appeals/remove-type/${label}`
          }
        })
      })
    }

    if(_.get(selectedProcedureFilters, 'length')) {
      selectedFilters.categories.push({
        heading: { text: 'Procedure' },
        items: selectedProcedureFilters.map(label => {
          return {
            text: label,
            href: `/main/your-appeals/remove-procedure/${label}`
          }
        })
      })
    }

    if(_.get(selectedLinkedAppealTypeFilters, 'length')) {
      selectedFilters.categories.push({
        heading: { text: 'Linked appeal type' },
        items: selectedLinkedAppealTypeFilters.map(label => {
          return {
            text: label,
            href: `/main/your-appeals/remove-linked-appeal-type/${label}`
          }
        })
      })
    }

    // if(_.get(selectedSiteVisitFilters, 'length')) {
    //   selectedFilters.categories.push({
    //     heading: { text: 'Site visit' },
    //     items: selectedSiteVisitFilters.map(label => {
    //       return {
    //         text: label,
    //         href: `/main/your-appeals/remove-site-visit/${label}`
    //       }
    //     })
    //   })
    // }

    // if(_.get(selectedPlanningObligationFilters, 'length')) {
    //   selectedFilters.categories.push({
    //     heading: { text: 'Planning obligation' },
    //     items: selectedPlanningObligationFilters.map(label => {
    //       return {
    //         text: label,
    //         href: `/main/your-appeals/remove-planning-obligation/${label}`
    //       }
    //     })
    //   })
    // }

    let totalAppeals = appeals.length
    let pageSize = 25
    let pagination = new Pagination(appeals, req.query.page, pageSize)
    appeals = pagination.getData()

    let lpaCheckboxes = require('../data/local-planning-authorities').map(lpa => {
      return { text: lpa, value: lpa }
    })

    let caseOfficerItems = caseOfficers.map(caseOfficer => ({ 
      text: caseOfficer.name, 
      value: caseOfficer.name
    }))

    let typeItems = types.map(type => ({ 
      text: type, 
      value: type
    }))


    res.render('main/appeals/index', {
      appeals,
      selectedFilters,
      pagination,
      totalAppeals,
      selectedInspectorItems,
      selectedLPAItems,
      selectedStatusItems,
      lpaCheckboxes,
      caseOfficerItems,
      typeItems
    })
  })

  router.get('/main/your-appeals/remove-inspector/:inspector', (req, res) => {
    _.set(req, 'session.data.filters.inspectors', _.pull(req.session.data.filters.inspectors, req.params.inspector))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-lpa/:lpa', (req, res) => {
    _.set(req, 'session.data.filters.lpas', _.pull(req.session.data.filters.lpas, req.params.lpa))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-status/:status', (req, res) => {
    _.set(req, 'session.data.filters.statuses', _.pull(req.session.data.filters.statuses, req.params.status))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-type/:type', (req, res) => {
    _.set(req, 'session.data.filters.types', _.pull(req.session.data.filters.types, req.params.type))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-procedure/:procedure', (req, res) => {
    _.set(req, 'session.data.filters.procedures', _.pull(req.session.data.filters.procedures, req.params.procedure))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-linked-appeal-type/:linkedAppealType', (req, res) => {
    _.set(req, 'session.data.filters.linkedAppealTypes', _.pull(req.session.data.filters.linkedAppealTypes, req.params.linkedAppealType))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-site-visit/:siteVisit', (req, res) => {
    _.set(req, 'session.data.filters.siteVisit', _.pull(req.session.data.filters.siteVisit, req.params.siteVisit))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/remove-planning-obligation/:planningObligation', (req, res) => {
    _.set(req, 'session.data.filters.planningObligation', _.pull(req.session.data.filters.planningObligation, req.params.planningObligation))
    res.redirect('/main/your-appeals')
  })

  router.get('/main/your-appeals/clear-filters', (req, res) => {
    _.set(req, 'session.data.filters.inspectors', null)
    _.set(req, 'session.data.filters.lpas', null)
    _.set(req, 'session.data.filters.statuses', null)
    _.set(req, 'session.data.filters.types', null)
    _.set(req, 'session.data.filters.procedures', null)
    _.set(req, 'session.data.filters.linkedAppealTypes', null)
    _.set(req, 'session.data.filters.siteVisit', null)
    _.set(req, 'session.data.filters.planningObligation', null)
    res.redirect('/main/your-appeals')
  })

}