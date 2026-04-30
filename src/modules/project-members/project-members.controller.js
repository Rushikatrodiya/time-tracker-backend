const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
} = require("./project-members.service");

const addProjectMemberController = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const { userId } = req.body;

  const member = await addProjectMember(projectId, userId);
  return success(res, member, "Member added successfully");
});

const removeProjectMemberController = asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;
  const { id: currentUserId, role: currentUserRole } = req.user;
  const result = await removeProjectMember(
    projectId,
    userId,
    currentUserId,
    currentUserRole,
  );
  return success(res, result, "Member removed successfully");
});

const getProjectMembersController = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const members = await getProjectMembers(projectId);
  return success(res, members, "Project members retrieved successfully");
});

module.exports = {
  addProjectMemberController,
  removeProjectMemberController,
  getProjectMembersController,
};
