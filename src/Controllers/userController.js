const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbConnect = require("../Config/database");
const StatusCode = require("../Services/commonFunctions");

// Register user Api.
const registerUser = (req, res) => {
  const userData = req.body;
  const { first_name, last_name, email, password, role } = userData;

  // Validate user input
  if (!first_name || !last_name || !email || !password) {
    return StatusCode.sendBadRequestResponse(res, "All fields are required");
  }

  // Check if the user already exists
  dbConnect.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (error, rows) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }

      if (rows.length > 0) {
        return StatusCode.conflictWithClient(res, "User already exists");
      }

      // Hash the password
      bcrypt.hash(password, 10, (hashError, hashedPassword) => {
        if (hashError) {
          return StatusCode.InternalErrorResponse(res, "Internal Server Error");
        }

        // Insert the user data into the database
        dbConnect.query(
          "INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)",
          [first_name, last_name, email, hashedPassword, role || "user"],
          (insertError, result) => {
            if (insertError) {
              return StatusCode.InternalErrorResponse(
                res,
                "Internal Server Error"
              );
            }

            const insertedUserId = result.insertId;

            // Generate JWT token with user ID
            const token = jwt.sign(
              { id: insertedUserId, email, role },
              process.env.SECRET_KEY
            );

            // Update the user's token in the database
            dbConnect.query(
              "UPDATE users SET token = ? WHERE id = ?",
              [token, insertedUserId],
              (updateError) => {
                if (updateError) {
                  return StatusCode.InternalErrorResponse(
                    res,
                    "Internal Server Error"
                  );
                }

                // Retrieve the inserted user's data
                dbConnect.query(
                  "SELECT * FROM users WHERE id = ?",
                  [insertedUserId],
                  (err, rows) => {
                    if (err) {
                      return StatusCode.InternalErrorResponse(
                        res,
                        "Internal Server Error"
                      );
                    }
                    // Send the inserted user's data in the response
                    StatusCode.sendSuccessResponse(
                      res,
                      "User registered successfully",
                      rows[0],
                      token
                    );
                  }
                );
              }
            );
          }
        );
      });
    }
  );
};

// Login user Api.
const login = (req, res) => {
  const { email, password } = req.body;

  // Validate user input
  if (!email || !password) {
    return StatusCode.sendBadRequestResponse(
      res,
      "Email and password are required"
    );
  }

  // Check if the user exists
  dbConnect.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (error, rows) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }

      if (rows.length === 0) {
        return StatusCode.sendUnauthorizedResponse(res, "Invalid credentials");
      }

      const user = rows[0];
      // Compare passwords
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.log(err, "error");
          return StatusCode.InternalErrorResponse(res, "Internal Server Error");
        }

        if (!result) {
          return StatusCode.sendUnauthorizedResponse(
            res,
            "Invalid credentials"
          );
        }
        const insertedUserId = user.id;

        // Passwords match, generate JWT token
        const token = jwt.sign(
          { id: insertedUserId, email: user.email, role: user.role },
          process.env.SECRET_KEY
        );

        // Send token in response
        StatusCode.sendSuccessResponse(res, "Login successful", token);
      });
    }
  );
};

// Get loginUserProfile Api.
const getUserProfile = (req, res) => {
  const userId = req.user.id;
  // Query the database to fetch user profile based on the user ID
  dbConnect.query(
    "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
    [userId],
    (error, rows) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }

      // If no user found with the provided ID, return 404 error
      if (rows.length === 0) {
        return StatusCode.sendNotFoundResponse(res, "User not found");
      }

      // Return the user profile in the response
      StatusCode.sendSuccessResponse(
        res,
        "User profile fetched successfully",
        rows[0]
      );
    }
  );
};

// Update userProfile Api.
const updateUserProfile = (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, email } = req.body;

  // Check if the provided email already exists
  dbConnect.query(
    "SELECT * FROM users WHERE email = ? AND id != ?",
    [email, userId],
    (emailCheckError, emailCheckResult) => {
      if (emailCheckError) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }

      // If the query returns rows, it means the email already exists
      if (emailCheckResult.length > 0) {
        return StatusCode.conflictWithClient(res, "Email already exists");
      }

      // Update the user's profile
      dbConnect.query(
        "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
        [first_name, last_name, email, userId],
        (error, result) => {
          if (error) {
            return StatusCode.InternalErrorResponse(
              res,
              "Internal Server Error"
            );
          }

          // If no rows were affected by the update operation, it means the user does not exist
          if (result.affectedRows === 0) {
            return StatusCode.sendNotFoundResponse(res, "User not found");
          }

          // Query the database to fetch the updated user profile
          dbConnect.query(
            "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
            [userId],
            (err, rows) => {
              if (err) {
                return StatusCode.InternalErrorResponse(
                  res,
                  "Internal Server Error"
                );
              }

              if (rows.length === 0) {
                return StatusCode.sendNotFoundResponse(res, "User not found");
              }

              StatusCode.sendSuccessResponse(
                res,
                "User profile updated successfully",
                rows[0]
              );
            }
          );
        }
      );
    }
  );
};

// Change loginUser password Api.
const changePassword = (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password } = req.body;
  // Query to fetch the current password of the user from the database
  dbConnect.query(
    "SELECT password FROM users WHERE id = ?",
    [userId],
    (error, rows) => {
      if (error) {
        return StatusCode.InternalErrorResponse(res, "Internal Server Error");
      }

      // If no user found with the provided ID, return 404 error
      if (rows.length === 0) {
        return StatusCode.sendNotFoundResponse(res, "User not found");
      }

      const currentHashedPassword = rows[0].password;

      bcrypt.compare(
        current_password.toLowerCase(),
        currentHashedPassword,
        (compareError, isMatch) => {
          if (compareError) {
            return StatusCode.InternalErrorResponse(
              res,
              "Internal Server Error"
            );
          }

          if (!isMatch) {
            return StatusCode.sendUnauthorizedResponse(
              res,
              "Incorrect current password"
            );
          }
          // Hash the new password
          bcrypt.hash(new_password, 10, (hashError, hashedNewPassword) => {
            if (hashError) {
              return StatusCode.InternalErrorResponse(
                res,
                "Internal Server Error"
              );
            }
            // Update the user's password in the database with the hashed new password
            dbConnect.query(
              "UPDATE users SET password = ? WHERE id = ?",
              [hashedNewPassword, userId],
              (updateError, result) => {
                if (updateError) {
                  return StatusCode.InternalErrorResponse(
                    res,
                    "Internal Server Error"
                  );
                }
                // Return success message in response
                StatusCode.sendSuccessResponse(
                  res,
                  "Password changed successfully"
                );
              }
            );
          });
        }
      );
    }
  );
};

module.exports = userController = {
  registerUser,
  login,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
