const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const config = require('./env');

passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ 'profile.googleId': profile.id });

      if (user) {
        // Check if existing Google user has companyId, if not assign Default Company
        if (!user.companyId && user.role !== 'SUPER_ADMIN') {
          const Company = require('../models/Company');
          let defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
          
          if (!defaultCompany) {
            console.log('Creating default company for returning Google OAuth user...');
            defaultCompany = await Company.create({
              name: "Default Company",
              notes: "Auto-created company for new user registrations",
              address: {
                street: "N/A",
                city: "N/A",
                state: "N/A",
                zipCode: "000000",
                country: "India",
              },
              billingDetails: {
                gstin: "N/A",
                billingEmail: "billing@socialscale.com",
              },
              status: "active",
            });
            console.log(`Default company created with ID: ${defaultCompany.companyId}`);
          }
          
          user.companyId = defaultCompany.companyId;
          await user.save();
          console.log(`Assigned company ID to returning Google OAuth user: ${user.email}`);
        }
        
        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.profile = {
          ...user.profile,
          googleId: profile.id,
          googleProfile: profile._json
        };
        
        // Check if user has companyId, if not assign Default Company
        if (!user.companyId && user.role !== 'SUPER_ADMIN') {
          const Company = require('../models/Company');
          let defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
          
          if (!defaultCompany) {
            console.log('Creating default company for existing Google OAuth user...');
            defaultCompany = await Company.create({
              name: "Default Company",
              notes: "Auto-created company for new user registrations",
              address: {
                street: "N/A",
                city: "N/A",
                state: "N/A",
                zipCode: "000000",
                country: "India",
              },
              billingDetails: {
                gstin: "N/A",
                billingEmail: "billing@socialscale.com",
              },
              status: "active",
            });
            console.log(`Default company created with ID: ${defaultCompany.companyId}`);
          }
          
          user.companyId = defaultCompany.companyId;
          console.log(`Assigned company ID to existing Google OAuth user: ${user.email}`);
        }
        
        await user.save();
        return done(null, user);
      }

      // Create new user with Default Company assignment
      const Company = require('../models/Company');
      const roles = require('./roles');
      
      // Get or create Default Company
      let defaultCompany = await Company.findOne({ name: "Default Company", deletedAt: null });
      
      if (!defaultCompany) {
        console.log('Creating default company for Google OAuth user...');
        defaultCompany = await Company.create({
          name: "Default Company",
          notes: "Auto-created company for new user registrations",
          address: {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            zipCode: "000000",
            country: "India",
          },
          billingDetails: {
            gstin: "N/A",
            billingEmail: "billing@socialscale.com",
          },
          status: "active",
        });
        console.log(`Default company created with ID: ${defaultCompany.companyId}`);
      } else {
        console.log(`Using existing default company for Google OAuth user: ${defaultCompany.companyId}`);
      }

      const newUser = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'google-auth-dummy-password', // Dummy password for Google users
        role: roles.COMPANY_USER,
        companyId: defaultCompany.companyId,
        profile: {
          googleId: profile.id,
          googleProfile: profile._json
        },
        status: 'active'
      });

      console.log(`Google OAuth user created with company ID: ${newUser.companyId}`);
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;