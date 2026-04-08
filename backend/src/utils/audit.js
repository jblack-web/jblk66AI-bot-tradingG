const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
  adminId,
  adminEmail,
  action,
  resource,
  resourceId,
  details,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
  status = 'Success',
  errorMessage,
}) => {
  try {
    const log = new AuditLog({
      adminId,
      adminEmail,
      action,
      resource,
      resourceId,
      details,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

module.exports = { createAuditLog };
