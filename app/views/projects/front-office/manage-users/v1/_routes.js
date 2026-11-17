const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const BASE = '/projects/front-office/manage-users/v1'
const VIEWS = 'projects/front-office/manage-users/v1'

// -----------------------------------------------
// DATA
// -----------------------------------------------

const PLANS = [
  { id: 'plan-6', ref: 'PLAN/000006', title: 'East Borough local plan' },
  { id: 'plan-5', ref: 'PLAN/000005', title: 'Southampton spatial development strategy' },
  { id: 'plan-7', ref: 'PLAN/000007', title: 'East Borough minerals and waste plan' }
]

const ACCESS_LEVELS = {
  admin: 'Admin',
  basic: 'Basic'
}

function seedUsers () {
  return [
    {
      id: 'u1',
      firstName: 'Sam',
      lastName: 'Patel',
      email: 'sam.patel@eastborough.gov.uk',
      isCurrentUser: true,
      access: { 'plan-6': 'admin', 'plan-5': 'admin', 'plan-7': 'admin' }
    },
    {
      id: 'u2',
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex.morgan@eastborough.gov.uk',
      access: { 'plan-6': 'admin', 'plan-7': 'basic' }
    },
    {
      id: 'u3',
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya.shah@eastborough.gov.uk',
      access: { 'plan-6': 'basic' }
    },
    {
      id: 'u4',
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan.lee@eastborough.gov.uk',
      access: { 'plan-5': 'basic', 'plan-6': 'basic' }
    }
  ]
}

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

function getUsers (req) {
  if (!req.session.manageUsers) req.session.manageUsers = seedUsers()
  return req.session.manageUsers
}

function getDraft (req) {
  if (!req.session.manageUsersDraft) {
    req.session.manageUsersDraft = { firstName: '', lastName: '', email: '', access: {} }
  }
  return req.session.manageUsersDraft
}

function fullName (user) {
  return `${user.firstName} ${user.lastName}`.trim()
}

// Plans the user has access to, in the standard plan order
function planAccessList (user) {
  return PLANS
    .filter(plan => user.access && user.access[plan.id])
    .map(plan => ({ ...plan, level: user.access[plan.id], levelText: ACCESS_LEVELS[user.access[plan.id]] }))
}

function isEditing (draft) {
  return Boolean(draft.id)
}

// In edit mode, or once the user has reached check answers, question pages return there
function nextPage (req, defaultNext) {
  const draft = getDraft(req)
  if (isEditing(draft) || req.query.returnTo === 'check') return `${BASE}/check-answers`
  return `${BASE}/${defaultNext}`
}

function errorSummaryList (errors) {
  return Object.keys(errors).map(key => ({ text: errors[key], href: `#${key}` }))
}

function renderWithErrors (res, view, errors, extra = {}) {
  res.render(`${VIEWS}/${view}`, {
    errors,
    errorList: errorSummaryList(errors),
    ...extra
  })
}

// -----------------------------------------------
// LOCALS FOR EVERY PAGE IN THIS PROTOTYPE
// -----------------------------------------------

router.use(function (req, res, next) {
  const draft = getDraft(req)
  res.locals.base = BASE
  res.locals.plans = PLANS
  res.locals.accessLevels = ACCESS_LEVELS
  res.locals.users = getUsers(req).map(user => ({
    ...user,
    name: fullName(user),
    planAccess: planAccessList(user)
  }))
  res.locals.draft = { ...draft, name: fullName(draft), planAccess: planAccessList(draft) }
  res.locals.editing = isEditing(draft)
  // Saved user being edited, so per-plan removal only offers plans they actually have
  res.locals.savedUser = isEditing(draft)
    ? res.locals.users.find(u => u.id === draft.id)
    : null
  res.locals.returnTo = req.query.returnTo
  next()
})

// -----------------------------------------------
// USER LIST
// -----------------------------------------------

router.get('/manage-users', function (req, res) {
  const flash = req.session.manageUsersFlash
  delete req.session.manageUsersFlash
  res.render(`${VIEWS}/manage-users`, { flash })
})

// Reset prototype data
router.get('/reset', function (req, res) {
  delete req.session.manageUsers
  delete req.session.manageUsersDraft
  delete req.session.manageUsersFlash
  res.redirect(`${BASE}/manage-users`)
})

// -----------------------------------------------
// ADD / EDIT
// -----------------------------------------------

router.get('/add-user', function (req, res) {
  req.session.manageUsersDraft = { firstName: '', lastName: '', email: '', access: {} }
  res.redirect(`${BASE}/user-name`)
})

router.get('/edit-user', function (req, res) {
  const user = getUsers(req).find(u => u.id === req.query.id)
  if (!user) return res.redirect(`${BASE}/manage-users`)
  req.session.manageUsersDraft = JSON.parse(JSON.stringify(user))
  res.redirect(`${BASE}/check-answers`)
})

router.get('/cancel', function (req, res) {
  delete req.session.manageUsersDraft
  res.redirect(`${BASE}/manage-users`)
})

// Name
router.post('/user-name', function (req, res) {
  const draft = getDraft(req)
  const firstName = (req.body['first-name'] || '').trim()
  const lastName = (req.body['last-name'] || '').trim()
  const errors = {}

  if (!firstName) errors['first-name'] = 'Enter their first name'
  if (!lastName) errors['last-name'] = 'Enter their last name'

  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'user-name', errors, { values: { firstName, lastName } })
  }

  draft.firstName = firstName
  draft.lastName = lastName
  res.redirect(nextPage(req, 'user-email'))
})

// Email
router.post('/user-email', function (req, res) {
  const draft = getDraft(req)
  const email = (req.body.email || '').trim()
  const errors = {}

  if (!email) {
    errors.email = 'Enter their email address'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter an email address in the correct format, like name@example.gov.uk'
  } else if (getUsers(req).some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== draft.id)) {
    errors.email = 'A user with this email address already exists'
  }

  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'user-email', errors, { values: { email } })
  }

  draft.email = email
  res.redirect(nextPage(req, 'user-plans'))
})

// Plans
router.post('/user-plans', function (req, res) {
  const draft = getDraft(req)
  let selected = req.body.plans || []
  if (!Array.isArray(selected)) selected = [selected]
  selected = selected.filter(id => PLANS.some(p => p.id === id))

  if (!selected.length) {
    return renderWithErrors(res, 'user-plans', { plans: 'Select at least one plan' }, { values: { plans: [] } })
  }

  // Keep existing access levels for plans still selected, drop the rest
  const access = {}
  selected.forEach(id => { access[id] = draft.access[id] || '' })
  draft.access = access

  // Access level must always be confirmed after plans change
  const returnTo = (isEditing(draft) || req.query.returnTo === 'check') ? '?returnTo=check' : ''
  res.redirect(`${BASE}/user-access${returnTo}`)
})

// Access level per plan
router.post('/user-access', function (req, res) {
  const draft = getDraft(req)
  const errors = {}
  const values = {}

  Object.keys(draft.access).forEach(planId => {
    const level = req.body[`access-${planId}`]
    values[planId] = level
    if (!ACCESS_LEVELS[level]) {
      const plan = PLANS.find(p => p.id === planId)
      errors[`access-${planId}`] = `Select an access level for ${plan.title}`
    }
  })

  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'user-access', errors, { values })
  }

  Object.keys(values).forEach(planId => { draft.access[planId] = values[planId] })
  res.redirect(`${BASE}/check-answers`)
})

// Check answers – add or save
router.post('/check-answers', function (req, res) {
  const draft = getDraft(req)
  const users = getUsers(req)

  if (isEditing(draft)) {
    const index = users.findIndex(u => u.id === draft.id)
    if (index > -1) users[index] = { ...users[index], ...draft }
    req.session.manageUsersFlash = {
      heading: `${fullName(draft)}'s details have been updated`
    }
  } else {
    draft.id = `u${Date.now()}`
    users.push(draft)
    req.session.manageUsersFlash = {
      heading: `${fullName(draft)} has been added`,
      body: `We have sent an email to ${draft.email} with instructions on how to sign in.`
    }
  }

  delete req.session.manageUsersDraft
  res.redirect(`${BASE}/manage-users`)
})

// -----------------------------------------------
// REMOVE
// -----------------------------------------------

router.get('/remove-user', function (req, res) {
  const user = res.locals.users.find(u => u.id === req.query.id)
  if (!user || user.isCurrentUser) return res.redirect(`${BASE}/manage-users`)
  res.render(`${VIEWS}/remove-user`, { user })
})

router.post('/remove-user', function (req, res) {
  const users = getUsers(req)
  const user = users.find(u => u.id === req.query.id)

  if (!user || user.isCurrentUser) return res.redirect(`${BASE}/manage-users`)

  req.session.manageUsers = users.filter(u => u.id !== user.id)
  req.session.manageUsersFlash = {
    heading: `${fullName(user)} has been removed`,
    body: 'They can no longer access any plans.'
  }
  res.redirect(`${BASE}/manage-users`)
})

// -----------------------------------------------
// REMOVE ACCESS TO ONE PLAN
// -----------------------------------------------

function findUserAndPlan (res, query) {
  const user = res.locals.users.find(u => u.id === query.id)
  const plan = user && user.planAccess.find(p => p.id === query.plan)
  return { user, plan }
}

router.get('/remove-access', function (req, res) {
  const { user, plan } = findUserAndPlan(res, req.query)
  if (!user || !plan) return res.redirect(`${BASE}/manage-users`)

  // Removing their only plan means removing the user
  if (user.planAccess.length === 1) return res.redirect(`${BASE}/remove-user?id=${user.id}`)

  const remainingPlans = user.planAccess.filter(p => p.id !== plan.id)
  res.render(`${VIEWS}/remove-access`, { user, plan, remainingPlans })
})

router.post('/remove-access', function (req, res) {
  const { user, plan } = findUserAndPlan(res, req.query)
  if (!user || !plan || user.planAccess.length === 1) return res.redirect(`${BASE}/manage-users`)

  const saved = getUsers(req).find(u => u.id === user.id)
  delete saved.access[plan.id]

  delete req.session.manageUsersDraft
  req.session.manageUsersFlash = {
    heading: `${user.name} no longer has access to ${plan.title}`
  }
  res.redirect(`${BASE}/manage-users`)
})

module.exports = router
