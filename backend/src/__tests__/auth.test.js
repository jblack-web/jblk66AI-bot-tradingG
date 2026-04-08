process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  actualMongoose.connect = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(actualMongoose.connection, 'readyState', {
    get: () => 1,
    configurable: true,
  });
  return actualMongoose;
});

const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const mockAdminBase = {
  _id: 'admin-uuid-1234',
  email: 'admin@test.com',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'SuperAdmin',
  permissions: ['all'],
  isActive: true,
  isLocked: false,
  twoFAEnabled: false,
  failedLoginAttempts: 0,
  toJSON: function () {
    const { password, twoFASecret, backupCodes, ...rest } = this;
    return rest;
  },
};

const mockSessionBase = {
  _id: 'session-uuid-1234',
  adminId: 'admin-uuid-1234',
  isActive: true,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  lastActivityAt: new Date(),
};

jest.mock('../models/AdminUser', () => {
  function MockAdminUser(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  }
  MockAdminUser.findOne = jest.fn();
  MockAdminUser.findById = jest.fn();
  MockAdminUser.find = jest.fn();
  MockAdminUser.countDocuments = jest.fn();
  MockAdminUser.create = jest.fn();
  return MockAdminUser;
});

jest.mock('../models/AdminSession', () => {
  function MockAdminSession(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  }
  MockAdminSession.create = jest.fn();
  MockAdminSession.findOne = jest.fn();
  MockAdminSession.findByIdAndUpdate = jest.fn();
  MockAdminSession.updateMany = jest.fn();
  return MockAdminSession;
});

jest.mock('../models/AuditLog', () => {
  function MockAuditLog(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  }
  return MockAuditLog;
});

const AdminUser = require('../models/AdminUser');
const AdminSession = require('../models/AdminSession');

let app;
let hashedPassword;

beforeAll(async () => {
  hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
  app = require('../../server');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/admin/auth/login', () => {
  it('should return 400 if email or password is missing', async () => {
    const res = await request(app).post('/api/admin/auth/login').send({ email: 'admin@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('should return 401 for non-existent email', async () => {
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'unknown@test.com', password: 'anything' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should return 401 for wrong password and increment failed attempts', async () => {
    const admin = {
      ...mockAdminBase,
      password: hashedPassword,
      comparePassword: jest.fn().mockResolvedValue(false),
      incrementFailedLogin: jest.fn().mockResolvedValue(undefined),
    };
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
    expect(admin.incrementFailedLogin).toHaveBeenCalledTimes(1);
  });

  it('should return 200 with token on successful login', async () => {
    const admin = {
      ...mockAdminBase,
      password: hashedPassword,
      comparePassword: jest.fn().mockResolvedValue(true),
      resetFailedLogin: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    };
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });
    AdminSession.create.mockResolvedValue({ ...mockSessionBase });

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'CorrectPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.admin).toHaveProperty('email', 'admin@test.com');
    expect(res.body.admin).not.toHaveProperty('password');
  });

  it('should return 401 if account is inactive', async () => {
    const admin = { ...mockAdminBase, isActive: false };
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'CorrectPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/inactive/i);
  });

  it('should return 401 if account is locked', async () => {
    const admin = {
      ...mockAdminBase,
      isLocked: true,
      lockExpiresAt: new Date(Date.now() + 60000),
    };
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'CorrectPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/locked/i);
  });

  it('should return 200 with requiresTwoFA when 2FA enabled but no code given', async () => {
    const admin = {
      ...mockAdminBase,
      twoFAEnabled: true,
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    AdminUser.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(admin) });

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.com', password: 'CorrectPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requiresTwoFA', true);
    expect(res.body).not.toHaveProperty('token');
  });
});

describe('POST /api/admin/auth/refresh', () => {
  it('should return 400 if no refresh token provided', async () => {
    const res = await request(app).post('/api/admin/auth/refresh').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/refresh token is required/i);
  });

  it('should return 401 for an invalid refresh token string', async () => {
    const res = await request(app)
      .post('/api/admin/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });

  it('should return new access token with a valid refresh token', async () => {
    const payload = { id: 'admin-uuid-1234', email: 'admin@test.com', role: 'SuperAdmin' };
    const validRefreshToken = generateRefreshToken(payload);

    const session = {
      ...mockSessionBase,
      refreshToken: validRefreshToken,
      token: 'old-access-token',
      save: jest.fn().mockResolvedValue(undefined),
    };

    const admin = { ...mockAdminBase, isActive: true };

    AdminSession.findOne.mockResolvedValue(session);
    AdminUser.findById.mockResolvedValue(admin);

    const res = await request(app)
      .post('/api/admin/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });
});

describe('Role-based access control', () => {
  it('should return 403 for StakingAdmin accessing /api/admin/admins', async () => {
    const stakingAdmin = {
      ...mockAdminBase,
      _id: 'staking-admin-id',
      role: 'StakingAdmin',
    };

    const accessToken = generateAccessToken({
      id: stakingAdmin._id,
      email: stakingAdmin.email,
      role: stakingAdmin.role,
    });

    const session = {
      ...mockSessionBase,
      adminId: stakingAdmin._id,
      token: accessToken,
      save: jest.fn().mockResolvedValue(undefined),
    };

    AdminUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(stakingAdmin) });
    AdminSession.findOne.mockResolvedValue(session);

    const res = await request(app)
      .get('/api/admin/admins')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/insufficient permissions/i);
  });

  it('should return 200 for SuperAdmin accessing /api/admin/admins', async () => {
    const superAdmin = { ...mockAdminBase, role: 'SuperAdmin' };

    const accessToken = generateAccessToken({
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    const session = {
      ...mockSessionBase,
      token: accessToken,
      save: jest.fn().mockResolvedValue(undefined),
    };

    AdminUser.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(superAdmin) });
    AdminSession.findOne.mockResolvedValue(session);

    AdminUser.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });
    AdminUser.countDocuments.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admin/admins')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('admins');
    expect(Array.isArray(res.body.admins)).toBe(true);
  });

  it('should return 401 with no auth token', async () => {
    const res = await request(app).get('/api/admin/admins');
    expect(res.status).toBe(401);
  });
});
