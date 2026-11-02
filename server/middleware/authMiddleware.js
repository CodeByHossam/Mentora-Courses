const { protect } = require('./authTokenMiddleware');
const { authorize, requireAdmin, instructor, student } = require('./authRoleMiddleware');
const {
  verifyResourceOwnership,
  requireOwnershipOrAdmin,
} = require('./authOwnershipMiddleware');

module.exports = {
  protect,
  authorize,
  requireAdmin,
  verifyResourceOwnership,
  requireOwnershipOrAdmin,
  instructor,
  student,
  // Legacy exports for backward compatibility
  admin: requireAdmin,
  tokenMatchParams: verifyResourceOwnership,
};
