const dbConnect = require("../Config/database");
const StatusCode = require("../Services/commonFunctions");

// CreateBlog Api.
const createBlog = (req, res) => {
  const { title, subtitle, content } = req.body;
  const author_id = req.user.id;
  const image_url = req.file ? req.file.path : null;
  const created_date = new Date().toISOString();

  const query =
    "INSERT INTO blogs (title, subtitle, content, author_id, image_url, created_date) VALUES (?, ?, ?, ?, ?, ?)";
  dbConnect.query(
    query,
    [title, subtitle, content, author_id, image_url, created_date],
    (error, result) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }
      const postId = result.insertId;
      const responseData = {
        id: postId,
        title,
        subtitle,
        content,
        author_id,
        image_url,
        created_date,
      };
      StatusCode.sendSuccessResponse(
        res,
        "Blog created successfully",
        responseData
      );
    }
  );
};

// GetAllPosts Api.
const getAllPosts = (req, res) => {
  const query = "SELECT * FROM blogs";
  dbConnect.query(query, (error, rows) => {
    if (error) {
      return StatusCode.InternalErrorResponse(res, "Internal Server Error");
    }
    const postsWithFullImageUrl = rows.map((post) => {
      const image_url = post.image_url
        ? `${req.protocol}://${req.get("host")}/${post.image_url}`
        : null;
      return { ...post, image_url };
    });
    StatusCode.sendSuccessResponse(
      res,
      "Successfully retrieved all blog posts",
      postsWithFullImageUrl
    );
  });
};

// SearchPostByAuthor Api.
const searchPostsByAuthor = (req, res) => {
  const { author } = req.query;

  const query = `
    SELECT b.*
    FROM blogs b
    INNER JOIN users u ON b.author_id = u.id
    WHERE CONCAT(u.first_name, ' ', u.last_name) LIKE ?
  `;

  dbConnect.query(query, [`%${author}%`], (error, rows) => {
    if (error) {
      return StatusCode.InternalErrorResponse(res, "Internal Server Error");
    }

    if (rows.length === 0) {
      return StatusCode.sendNotFoundResponse(
        res,
        "No blog posts found for the specified author"
      );
    }
    StatusCode.sendSuccessResponse(
      res,
      "Successfully retrieved blog posts by the specified author",
      rows
    );
  });
};

// GetPostById Api.
const getPostById = (req, res) => {
  const postId = req.params.id;
  const query = "SELECT * FROM blogs WHERE id = ?";
  dbConnect.query(query, [postId], (error, rows) => {
    if (error) {
      return StatusCode.InternalErrorResponse(res, "Internal Server Error");
    }
    if (rows.length === 0) {
      return StatusCode.sendNotFoundResponse(res, "Post not found");
    }
    const post = rows[0];
    const image_url = post.image_url
      ? `${req.protocol}://${req.get("host")}/${post.image_url}`
      : null;
    StatusCode.sendSuccessResponse(res, "Successfully retrieved the post", {
      ...post,
      image_url,
    });
  });
};

// UpdatePostById Api.
const updatePostById = (req, res) => {
  const postId = req.params.id;
  const { title, subtitle, content } = req.body;

  const query =
    "UPDATE blogs SET title = ?, subtitle = ?, content = ? WHERE id = ?";
  dbConnect.query(
    query,
    [title, subtitle, content, postId],
    (error, result) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }
      if (result.affectedRows === 0) {
        return StatusCode.sendNotFoundResponse(res, "Post not found");
      }
      StatusCode.sendSuccessResponse(res, "Post updated successfully");
    }
  );
};

// DeletePostById Api.
const deletePostById = (req, res) => {
  const postId = req.params.id;

  const query = "DELETE FROM blogs WHERE id = ?";
  dbConnect.query(query, [postId], (error, result) => {
    if (error) {
      return StatusCode.InternalErrorResponse(res, "Internal Server Error");
    }
    if (result.affectedRows === 0) {
      return StatusCode.sendNotFoundResponse(res, "Post not found");
    }
    StatusCode.sendSuccessResponse(res, "Post deleted successfully");
  });
};

module.exports = blogController = {
  createBlog,
  getAllPosts,
  getPostById,
  updatePostById,
  deletePostById,
  searchPostsByAuthor,
};
