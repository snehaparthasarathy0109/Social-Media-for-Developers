const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

const Profile = require("../../Model/Profile");
const User = require("../../Model/User");
//Load Validation

const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

router.get("/test", (req, res) => res.json({ msg: "Profile works" }));

//@route GET api/profile
//@desc Get current user profile
//@access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])

      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this User";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);
//@route GET api/profile/all
//@desc Get all profiles
//@access Public
router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.nonprofile = "There are no profile";
        return res.status(404).json(errors);
      }

      res.json(profiles);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no Profile for this user" })
    );
});

//@route GET api/profile/handle/:handle
//@desc Get profile by handle
//@access Public

router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

//@route GET api/profile/user/:user
//@desc Get profile by userid
//@access Public

router.get("/user/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

//@route POST api/profile
//@desc Create User Profile
//@access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    //Get Feilds
    const profilefeilds = {};
    profilefeilds.user = req.user.id;
    if (req.body.handle) profilefeilds.handle = req.body.handle;
    if (req.body.company) profilefeilds.company = req.body.company;
    if (req.body.website) profilefeilds.website = req.body.website;
    if (req.body.bio) profilefeilds.bio = req.body.bio;
    if (req.body.status) profilefeilds.status = req.body.status;
    if (req.body.githubusername)
      profilefeilds.githubusername = req.body.githubusername;
    //split skills into an array.
    if (typeof req.body.skills !== "undefined") {
      profilefeilds.skills = req.body.skills.split(",");
    }
    //Social
    profilefeilds.social = {};
    if (req.body.youtube) profilefeilds.social.youtube = req.body.youtube;
    if (req.body.twitter) profilefeilds.social.twitter = req.body.twitter;
    if (req.body.facebook) profilefeilds.social.facebook = req.body.facebook;
    if (req.body.linkedin) profilefeilds.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profilefeilds.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profilefeilds },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        //Create
        //Check if handle exsists
        Profile.findOne({ handle: profilefeilds.handle }).then(profile => {
          if (profile) {
            errors.handle = "The handle already exists";
            res.status(400).json(errors);
          }
          //Save Profile
          new Profile(profilefeilds).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

//@route POST api/profile/expirience
//@desc Add expirience to profile
//@access Private
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };
      //Add to experience array
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    });
  }
);

//@route POST api/profile/education
//@desc Add education to profile
//@access Private
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        feildofstudy: req.body.feildofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };
      //Add to education array
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    });
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc Delete experience from profile
//@access Private
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        //Splice out of array
        profile.experience.splice(removeIndex, 1);

        //Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

//@route DELETE api/profile/education/:exp_id
//@desc Delete education from profile
//@access Private
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        //Splice out of array
        profile.education.splice(removeIndex, 1);

        //Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

//@route DELETE api/profile/
//@desc Delete user and profile
//@access Private

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        res.json({ success: true });
      });
    });
  }
);
module.exports = router;
