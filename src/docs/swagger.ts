export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'EVE Healthcare Diagnostic & Payment Service API',
    version: '1.0.0',
    description: `
## EVE Healthcare Backend Engineering Service
Production-grade backend service built with Node.js, Express, TypeScript, and Prisma ORM.

### Key Capabilities:
- **Authentication**: JWT-based stateless auth with password hashing (bcrypt) and Role-Based Access Control (PATIENT, ADMIN).
- **Centres & Tests Catalogue**: Diagnostic centres with geo-location, tests catalog, and multi-centre dynamic pricing.
- **Booking Lifecycle**: Robust booking workflow with server-authoritative price validation and state machine transitions:
  \`PENDING\` ➔ \`CONFIRMED\` / \`FAILED\` / \`CANCELLED\`.
- **Simulated Payment Gateway**: Atomic transactional processing for payments.
- **Strictly Idempotent Webhook**: Event-driven webhook handler with replay protection, duplicate prevention, and race condition immunity.
    `,
    contact: {
      name: 'Engineering Team',
      email: 'engineering@evehealthcare.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1',
    },
    {
      url: '/',
      description: 'Root URL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token obtained from /api/v1/auth/login or /api/v1/auth/signup',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request payload' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'fullName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'patient@example.com' },
          password: { type: 'string', minLength: 6, example: 'SecurePassword123' },
          fullName: { type: 'string', example: 'John Doe' },
          phone: { type: 'string', example: '+1-555-0199' },
          role: { type: 'string', enum: ['PATIENT', 'ADMIN'], default: 'PATIENT' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'patient@example.com' },
          password: { type: 'string', example: 'SecurePassword123' },
        },
      },
      CreateCentreRequest: {
        type: 'object',
        required: ['name', 'address', 'city', 'contactNumber'],
        properties: {
          name: { type: 'string', example: 'EVE Diagnostics Downtown' },
          address: { type: 'string', example: '450 Health Ave, Suite 100' },
          city: { type: 'string', example: 'New York' },
          contactNumber: { type: 'string', example: '+1-212-555-0144' },
        },
      },
      CreateTestRequest: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: { type: 'string', example: 'Comprehensive Metabolic Panel (CMP)' },
          description: { type: 'string', example: 'Evaluates kidney and liver function, electrolytes, and blood sugar.' },
          category: { type: 'string', example: 'Pathology' },
          sampleRequired: { type: 'string', example: 'Blood' },
        },
      },
      AddTestToCentreRequest: {
        type: 'object',
        required: ['testId', 'price'],
        properties: {
          testId: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4674-a5ff-22fd18a7a501' },
          price: { type: 'number', example: 45.0 },
          isAvailable: { type: 'boolean', default: true },
        },
      },
      CreateBookingRequest: {
        type: 'object',
        required: ['centreId', 'testId', 'appointmentTime'],
        properties: {
          centreId: { type: 'string', format: 'uuid', example: 'b1a2c3d4-0000-0000-0000-000000000001' },
          testId: { type: 'string', format: 'uuid', example: 'e5f6a7b8-0000-0000-0000-000000000002' },
          appointmentTime: { type: 'string', format: 'date-time', example: '2026-11-15T10:30:00.000Z' },
          notes: { type: 'string', example: 'Fasting 12 hours prior' },
        },
      },
      SimulatePaymentRequest: {
        type: 'object',
        required: ['bookingId'],
        properties: {
          bookingId: { type: 'string', format: 'uuid', example: 'a9b8c7d6-0000-0000-0000-000000000003' },
          paymentMethod: { type: 'string', enum: ['CARD', 'UPI', 'NET_BANKING', 'SIMULATED'], default: 'SIMULATED' },
          simulateStatus: { type: 'string', enum: ['SUCCESS', 'FAILED'], description: 'Explicit status for testing' },
        },
      },
      PaymentWebhookRequest: {
        type: 'object',
        required: ['eventId', 'eventType', 'bookingId', 'transactionId', 'amount'],
        properties: {
          eventId: { type: 'string', example: 'evt_sim_9918231a' },
          eventType: { type: 'string', enum: ['payment.succeeded', 'payment.failed'], example: 'payment.succeeded' },
          bookingId: { type: 'string', format: 'uuid', example: 'a9b8c7d6-0000-0000-0000-000000000003' },
          transactionId: { type: 'string', example: 'TXN-98127391' },
          amount: { type: 'number', example: 45.0 },
          signature: { type: 'string', example: 'sha256-hmac-signature-optional' },
          timestamp: { type: 'string', example: '2026-10-01T15:00:00Z' },
        },
      },
    },
  },
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new patient or admin',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } },
        },
        responses: {
          201: { description: 'User created successfully with JWT token' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user and return JWT token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Authentication successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/centres': {
      get: {
        tags: ['Centres & Tests'],
        summary: 'List diagnostic centres with their available tests and prices',
        parameters: [
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of diagnostic centres' },
        },
      },
      post: {
        tags: ['Centres & Tests'],
        summary: 'Create a new diagnostic centre (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCentreRequest' } } },
        },
        responses: {
          201: { description: 'Centre created' },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/centres/{id}': {
      get: {
        tags: ['Centres & Tests'],
        summary: 'Get detailed diagnostic centre info and test offerings',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Centre details' },
          404: { description: 'Centre not found' },
        },
      },
    },
    '/centres/{id}/tests': {
      post: {
        tags: ['Centres & Tests'],
        summary: 'Add or update diagnostic test offering and price at a centre (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddTestToCentreRequest' } } },
        },
        responses: {
          200: { description: 'Test offering updated' },
        },
      },
    },
    '/tests': {
      get: {
        tags: ['Centres & Tests'],
        summary: 'List all diagnostic tests in the master catalog',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of tests' },
        },
      },
      post: {
        tags: ['Centres & Tests'],
        summary: 'Add a new diagnostic test to master catalog (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTestRequest' } } },
        },
        responses: {
          201: { description: 'Test created' },
        },
      },
    },
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Book a diagnostic test at a centre',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } },
        },
        responses: {
          201: { description: 'Booking created with status PENDING' },
          400: { description: 'Past date or test not available at centre' },
        },
      },
      get: {
        tags: ['Bookings'],
        summary: 'List bookings (Patient sees own; Admin sees all)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'] } },
        ],
        responses: {
          200: { description: 'Bookings list' },
        },
      },
    },
    '/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking details by ID (Patient must own booking or be Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Booking details' },
          403: { description: 'Forbidden: unauthorized booking access' },
          404: { description: 'Booking not found' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Cancel an existing PENDING booking',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Booking cancelled' },
          409: { description: 'Cannot cancel non-pending booking' },
        },
      },
    },
    '/payments': {
      post: {
        tags: ['Payments & Webhook'],
        summary: 'Requirement 4: Simulate payment processing for a booking',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SimulatePaymentRequest' } } },
        },
        responses: {
          200: { description: 'Simulated payment completed; booking state updated to CONFIRMED or FAILED' },
          409: { description: 'Booking already paid, failed, or cancelled' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments & Webhook'],
        summary: 'Requirement 5: Idempotent payment webhook for asynchronous updates',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentWebhookRequest' } } },
        },
        responses: {
          200: { description: 'Webhook processed or duplicate event safely ignored (idempotent)' },
          400: { description: 'Amount mismatch or invalid payload' },
          404: { description: 'Booking not found' },
        },
      },
    },
  },
};
