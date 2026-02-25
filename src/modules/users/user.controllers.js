const { success } = require("../../utils/response");

const getUserProfileController = (req, res) => {
  return success(res, req.user, "User profile fetched successfully", 200);
};

module.exports = {
  getUserProfileController,
};
