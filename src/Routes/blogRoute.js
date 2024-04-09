const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth } = require("../Middlewares/auth");
const blogController = require("../Controllers/blogController");
const validate = require("../Middlewares/validate");
const blog = require("../Validations/blog");
const { storage } = require("../Middlewares/fileupload");

const upload = multer({ storage: storage });

// Route to create a new blog post
router.post(
    "/",
    auth(),
    validate(blog.createBlog), // Validation middleware for creating a blog post
    upload.single("image"),
    blogController.createBlog
  );
  
  // Route to get all blog posts
  router.get("/", auth(), blogController.getAllPosts);
  
  // Route to search blog posts by author
  router.get("/search", auth(), blogController.searchPostsByAuthor);
  
  // Route to get a specific blog post by ID
  router.get("/:id", auth(), blogController.getPostById);
  
  // Route to update a blog post by ID
  router.put(
    "/:id",
    auth(),
    validate(blog.updatePost), // Validation middleware for updating a blog post
    blogController.updatePostById
  );
  
  // Route to delete a blog post by ID
  router.delete("/:id", auth(), blogController.deletePostById);
module.exports = {
  route: router,
};
