'use strict'

const express = require('express')

// [START setup]
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const { Datastore } = require('@google-cloud/datastore')
const path = require('path')
const ds = new Datastore({
  projectId: process.env.PROJECT_ID,
  keyFilename: path.join(__dirname, '..', '..', process.env.GOOGLE_APPLICATION_CREDENTIALS)
})

function extractProfile (profile) {
  let imageUrl = ''
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    image: imageUrl
  }
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `cb` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH2_CLIENT_ID,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET,
      callbackURL: process.env.OAUTH2_CALLBACK,
      accessType: 'offline',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    (accessToken, refreshToken, profile, cb) => {
      // Extract the minimal profile information we need from the profile object
      // provided by Google
      cb(null, extractProfile(profile))
    }
  )
)

passport.serializeUser((user, cb) => {
  cb(null, user)
})
passport.deserializeUser((obj, cb) => {
  cb(null, obj)
})
// [END setup]

const router = express.Router()

// [START middleware]
// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired (req, res, next) {
  if (!req.user) {
    req.session.oauth2return = req.originalUrl
    return res.redirect('/auth/login')
  }
  next()
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables (req, res, next) {
  res.locals.profile = req.user
  res.locals.login = `/auth/login?return=${encodeURIComponent(
    req.originalUrl
  )}`
  res.locals.logout = `/auth/logout?return=${encodeURIComponent(
    req.originalUrl
  )}`
  next()
}
// [END middleware]

// Begins the authorization flow. The user will be redirected to Google where
// they can authorize the application to have access to their basic profile
// information. Upon approval the user is redirected to `/auth/google/callback`.
// If the `return` query parameter is specified when sending a user to this URL
// then they will be redirected to that URL when the flow is finished.
// [START authorize]
router.get(
  // Login url
  '/auth/login',

  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
  (req, res, next) => {
    if (req.query.return) {
      req.session.oauth2return = req.query.return
    }
    next()
  },

  // Start OAuth 2 flow using Passport.js
  passport.authenticate('google', { scope: ['email', 'profile'] })
)
// [END authorize]

// [START callback]
router.get(
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/callback',

  // Finish OAuth 2 flow using Passport.js
  passport.authenticate('google'),

  // Redirect back to the original page, if any
  (req, res) => {
    try {
      let key
      key = ds.key('User')
    
      const entity = {
        key: key,
        data: req.user.passport.displayName
      }
      ds.save(entity)
    } catch (error) {
      console.log(error)
    }

    const redirect = req.session.oauth2return || '/'
    delete req.session.oauth2return
    res.redirect(redirect)
  }
)
// [END callback]

// Deletes the user's credentials and profile from the session.
// This does not revoke any active tokens.
router.get('/auth/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = {
  extractProfile: extractProfile,
  router: router,
  required: authRequired,
  template: addTemplateVariables
}
