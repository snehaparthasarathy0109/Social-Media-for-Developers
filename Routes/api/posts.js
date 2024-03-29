const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const Post = require("../../Model/Post");
//Profile Model

const Profile = require("../../Model/Profile");

router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

//Validation

const validatePostInput = require("../../validation/post");

//@route GET api/posts
//@desc GET Post
//@access Public

router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json(err));
});

//@route GET api/posts/:id
//@desc GET Post by id
//@access Public

router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: "No post found for that id" })
    );
});

//@route POST api/posts
//@desc Create Post
//@access Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avater: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

//@route DELETE api/posts/:id
//@desc Delete Post
//@access Private

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ nonauthorized: "User not Authorized" });
          }
          //Delete

          post.remove().then(() => res.json({ success: "true" }));
        })

        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route POST api/like/:id
//@desc Like Post
//@access Private

router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ useralreadyliked: "User Already Liked this Post" });
          }

          //Add the user id to likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })

        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route POST api/unlike/:id
//@desc UnLike Post
//@access Private

router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You have not yet liked this post" });
          }

          //Get the remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          //Splice out of array
          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })

        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    });
  }
);

//@route POST api/posts/comment/:id
//@desc Add Comment to Post
//@access Private

router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        //Add comments to array
        post.comments.unshift(newComment);

        //Save

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(400).json({ postnotfound: "No posts found" }));
  }
);

//@route DELETE api/posts/comment/:id/comment_id
//@desc Remove Comment from Post
//@access Private

router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //Check if comment exsits
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexist: "Comment dooes not exist" });
        }
        //Get Remove Index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        //Splice comment out of the array

        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(400).json({ postnotfound: "No posts found" }));
  }
);

module.exports = router;
