const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes', () => {
  it('should register a user with strong password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'StrongPass1!' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User registered successfully.');
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'weak', password: 'weak' });
    expect(res.statusCode).toEqual(400);
  });

  it('should login and return token', async () => {
    await request(app).post('/api/auth/register').send({ username: 'loginuser', password: 'StrongPass1!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'StrongPass1!' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should access protected route with valid token', async () => {
    await request(app).post('/api/auth/register').send({ username: 'loginuser', password: 'StrongPass1!' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'StrongPass1!' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });

  it('should reject protected route without token', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.statusCode).toEqual(401);
  });

  it('should rate limit login attempts', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'fail', password: 'wrong' });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'fail', password: 'wrong' });
    expect(res.statusCode).toEqual(429);
  });
});