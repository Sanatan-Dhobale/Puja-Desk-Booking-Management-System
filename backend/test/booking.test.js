import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Booking, { bookingStatuses, pujaNames } from '../src/models/Booking.js';

// Use a unique database for every run; never use the application's database.
test('Booking REST APIs with MongoDB', async (t) => {
  const database = 'puja_booking_test_' + randomUUID().replaceAll('-', '');
  let server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
    }
  });

  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', {
    dbName: database,
    serverSelectionTimeoutMS: 5000,
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/bookings`;

  async function request(method, route = '', body) {
    const response = await fetch(base + route, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await response.json();
    assert.equal(typeof json.success, 'boolean');
    assert.equal(typeof json.message, 'string');
    assert.ok(Object.hasOwn(json, 'data'));
    return { status: response.status, ...json };
  }

  function booking(overrides = {}) {
    return {
      devotee: { name: ' Asha Sharma ', phone: '+919876543210', email: 'ASHA@example.com' },
      pujaName: 'Ganesh Puja',
      date: '2026-12-15',
      amount: 1500,
      ...overrides,
    };
  }

  let id;
  await t.test('create, default status, trim and persist', async () => {
    const response = await request('POST', '', booking());
    assert.equal(response.status, 201);
    assert.equal(response.data.status, 'Pending');
    assert.equal(response.data.devotee.name, 'Asha Sharma');
    assert.equal(response.data.devotee.email, 'asha@example.com');
    assert.ok(response.data.createdAt);
    id = response.data._id;
    assert.equal((await Booking.findById(id)).amount, 1500);
  });

  await t.test('fetch by ID and change to every allowed status', async () => {
    assert.equal((await request('GET', '/' + id)).data._id, id);
    for (const status of bookingStatuses) {
      const updated = await request('PUT', `/${id}/status`, { status });
      assert.equal(updated.status, 200);
      assert.equal(updated.data.status, status);
      assert.equal((await Booking.findById(id)).status, status);
    }
  });

  await t.test('search, filter, sorting, and pagination use MongoDB', async () => {
    await request('POST', '', booking({ pujaName: 'Laxmi Puja', amount: 500, status: 'Confirmed' }));
    await request('POST', '', booking({ amount: 2500, status: 'Confirmed' }));
    await request('POST', '', booking({ devotee: { name: 'Special .* Devotee', phone: '1234567' }, amount: 50 }));
    const first = await request('GET', '?search=asha&status=Confirmed&sortBy=amount&order=asc&page=1&limit=1');
    assert.equal(first.status, 200);
    assert.equal(first.data.length, 1);
    assert.equal(first.data[0].amount, 500);
    assert.deepEqual(first.pagination, { page: 1, limit: 1, total: 2, totalPages: 2 });
    const second = await request('GET', '?status=Confirmed&sortBy=amount&order=asc&page=2&limit=1');
    assert.equal(second.data[0].amount, 2500);
    const literal = await request('GET', '?search=' + encodeURIComponent('.*'));
    assert.equal(literal.pagination.total, 1);
    assert.equal(literal.data[0].devotee.name, 'Special .* Devotee');
    for (const search of ['ganesh', '9876543210', 'ASHA@EXAMPLE.COM']) {
      assert.ok((await request('GET', '?search=' + encodeURIComponent(search))).pagination.total > 0);
    }
    const empty = await request('GET', '?search=NoMatchingDevotee');
    assert.deepEqual(empty.data, []);
    assert.equal(empty.pagination.total, 0);
    const beyond = await request('GET', '?page=999');
    assert.deepEqual(beyond.data, []);
  });

  await t.test('invalid IDs return 400, missing records return 404', async () => {
    for (const method of ['GET', 'PUT']) {
      const suffix = method === 'PUT' ? '/status' : '';
      const body = method === 'PUT' ? { status: 'Confirmed' } : undefined;
      assert.equal((await request(method, '/bad-id' + suffix, body)).status, 400);
      const missing = await request(method, '/000000000000000000000000' + suffix, body);
      assert.equal(missing.status, 404);
      assert.equal(missing.success, false);
      assert.equal(missing.data, null);
    }
  });

  await t.test('reject invalid bodies without inserting records', async () => {
    const count = await Booking.countDocuments();
    const invalidBodies = [
      {}, [], null,
      booking({ devotee: { name: ' ', phone: '123' } }),
      booking({ devotee: { name: 'Asha', phone: '1234567', email: 'bad-email' } }),
      booking({ devotee: { name: 'Asha', phone: '1234567', address: 123 } }),
      booking({ devotee: { name: 'Asha', phone: '1234567', admin: true } }),
      booking({ pujaName: ' ' }),
      booking({ pujaName: 'Unknown Puja' }),
      booking({ pujaName: 'Lakshmi Puja' }),
      booking({ amount: -1 }),
      booking({ amount: '1500' }),
      booking({ date: '2026-02-30' }),
      booking({ date: '12/15/2026' }),
      booking({ status: 'Cancelled' }),
      booking({ status: 'pending' }),
      booking({ unknown: 'field' }),
    ];
    for (const body of invalidBodies) {
      assert.equal((await request('POST', '', body)).status, 400, JSON.stringify(body));
    }
    assert.equal((await request('POST')).status, 400);
    assert.equal(await Booking.countDocuments(), count);
  });

  await t.test('status updates accept only a valid status field', async () => {
    for (const body of [{}, { status: 'Cancelled' }, { status: 'confirmed' }, { status: 'Confirmed', amount: 1 }, { status: { $ne: '' } }]) {
      assert.equal((await request('PUT', `/${id}/status`, body)).status, 400);
    }
    assert.equal((await Booking.findById(id)).status, 'Completed');
  });

  await t.test('reject invalid, repeated, and unknown query parameters', async () => {
    for (const query of [
      'page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=9007199254740992',
      'page=9007199254740991&limit=100', 'limit=101', 'limit=0',
      'sortBy=password', 'order=up', 'status=Cancelled', 'search=',
      'search=' + 'x'.repeat(101), 'page=1&page=2', 'status[$ne]=x', 'unknown=x',
    ]) {
      assert.equal((await request('GET', '?' + query)).status, 400, query);
    }
  });

  await t.test('malformed JSON and unknown routes have consistent errors', async () => {
    const malformed = await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { success: false, message: 'Invalid JSON body', data: null });
    const missing = await request('GET', '/not/a/route');
    assert.equal(missing.status, 404);
    assert.equal(missing.data, null);
  });

  await t.test('unexpected database failures hide internal details', async (t) => {
    t.mock.method(Booking, 'findById', async () => {
      throw new Error('Private database connection details');
    });
    t.mock.method(console, 'error', () => {});
    const response = await request('GET', '/' + id);
    assert.equal(response.status, 500);
    assert.equal(response.message, 'Internal server error');
    assert.equal(response.data, null);
  });
  await t.test('only the four allowed pujas can be created', async () => {
    for (const pujaName of pujaNames) {
      const response = await request('POST', '', booking({ pujaName }));
      assert.equal(response.status, 201);
      assert.equal(response.data.pujaName, pujaName);
    }
    await assert.rejects(new Booking(booking({ pujaName: 'Unknown Puja' })).validate(), { name: 'ValidationError' });
  });
  await t.test('Mongoose validates direct writes too', async () => {
    await assert.rejects(new Booking(booking({ status: 'Cancelled' })).validate(), { name: 'ValidationError' });
    await assert.rejects(new Booking(booking({ amount: -1 })).validate(), { name: 'ValidationError' });
    await assert.rejects(new Booking(booking({ devotee: {} })).validate(), { name: 'ValidationError' });
  });
});
