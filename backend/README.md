# BugVault Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```
MONGO_URI=mongodb://localhost:27017/bugvault
JWT_SECRET=your-secret-key-change-this
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

3. Make sure MongoDB is running (local or use MongoDB Atlas)

4. Seed the admin user:
```bash
npm run seed
```

This creates:
- Email: `admin@bugvault.local`
- Password: `admin1234`

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/register` - Register new user (admin only)
- `GET /api/v1/vulnerabilities` - List vulnerabilities
- `POST /api/v1/vulnerabilities` - Create vulnerability
- `GET /api/v1/vulnerabilities/:id` - Get vulnerability
- `PUT /api/v1/vulnerabilities/:id` - Update vulnerability
- `DELETE /api/v1/vulnerabilities/:id` - Delete vulnerability (admin only)
- `GET /api/v1/stats` - Get dashboard statistics


