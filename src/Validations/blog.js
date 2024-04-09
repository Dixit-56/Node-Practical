const Joi = require("joi");

const createBlog = Joi.object({
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  content: Joi.string().required(),
  image_url: Joi.string().required(),
});

const updatePost = Joi.object({
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  content: Joi.string().required(),
});

module.exports = blog = {
  createBlog,
  updatePost,
};
