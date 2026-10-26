# Project Structure

Mentora is a full-stack learning marketplace with a React/Vite client and an Express/MongoDB server.

```text
Mentora-Courses/
├── client/                 # React + Vite frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── assets/         # Images and static resources
│       ├── components/     # Reusable UI components
│       ├── config/         # Client configuration
│       ├── data/           # Static/demo-free data helpers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Route-level pages
│       ├── services/       # API service helpers
│       ├── store/          # Redux Toolkit store, slices, RTK Query APIs
│       ├── styles/         # Global styles
│       └── utils/          # Client utilities
├── server/                 # Express API
│   ├── config/             # DB and environment config
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth, CSRF, rate limiting, caching, monitoring
│   ├── migrations/         # Data migration scripts
│   ├── models/             # Mongoose models
│   ├── routes/             # Express route definitions
│   ├── scripts/            # Maintenance/admin scripts
│   ├── seeders/            # Seed data scripts
│   ├── services/           # Business services
│   ├── tests/              # Jest tests
│   ├── utils/              # Shared server utilities
│   ├── validations/        # Request validation schemas
│   └── views/              # EJS views
├── documentation/          # Programmer documentation
└── README.md               # Project overview and setup
```

## Key Entry Points

- Client entry: `client/src/main.jsx`
- Server entry: `server/server.js`
- API health check: `GET /api/health`

## Important Conventions

- API responses use a standard `{ success, message, data }` shape where applicable.
- Authentication uses JWT bearer tokens plus CSRF protection for state-changing requests.
- Rate limiting is applied per route group in `server/server.js` and route files.
- In-memory response caching is used for selected GET endpoints.
- Payment flows are direct-transfer only; Stripe/PayPal legacy endpoints return `410 Gone`.
