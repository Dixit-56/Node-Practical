//common functionality.
// status(200).
const sendSuccessResponse = (res, message, data, token = null) => {
  const response = { success: true, message, data };
  if (token) {
    response.token = token;
  }
  res.status(200).json(response);
};

// status(400).
const sendBadRequestResponse = (res, message) => {
  return res.status(400).json({ success: false, message, data: {} });
};

// status(401).
const sendUnauthorizedResponse = (res, message) => {
  return res.status(401).json({ success: false, message });
};

//status(403).
const forbiddenResponse = (res, message) => {
  return res.status(403).json({
    success: false,
    message: typeof message === "string" ? message : "Forbidden",
  });
};

// status(404).
const sendNotFoundResponse = (res, message, data = null) => {
  const response = { success: false, message };

  if (data !== null) {
    response.data = data;
  }

  return res.status(404).json(response);
};

// status(409).
const conflictWithClient = (res, message) => {
  return res.status(409).json({ success: false, message });
};

// status(500).
const InternalErrorResponse = (res, error) => {
  return res.status(500).json({ success: false, error });
};

module.exports = StatusCode = {
  sendSuccessResponse,
  sendBadRequestResponse,
  sendUnauthorizedResponse,
  forbiddenResponse,
  sendNotFoundResponse,
  conflictWithClient,
  InternalErrorResponse,
};
