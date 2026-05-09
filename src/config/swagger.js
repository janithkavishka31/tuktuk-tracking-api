const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'TukTuk Tracking API',
    version: '1.0.0',
    description: 'API for tracking TukTuks, devices, locations and user management',
  },
  servers: [{ url: process.env.BASE_URL || 'http://localhost:3000', description: 'Local server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
    schemas: {
      UserRole: { type: 'string', enum: ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'STATION_ADMIN', 'POLICE'] },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/UserRole' },
          provinceId: { type: 'string', nullable: true },
          districtId: { type: 'string', nullable: true },
          stationId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string' }, role: { $ref: '#/components/schemas/UserRole' }, provinceId: { type: 'string' }, districtId: { type: 'string' }, stationId: { type: 'string' } },
      },
      UserUpdate: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string' }, role: { $ref: '#/components/schemas/UserRole' }, provinceId: { type: 'string' }, districtId: { type: 'string' }, stationId: { type: 'string' } } },
      Province: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      District: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, provinceId: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      PoliceStation: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, districtId: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      TukTuk: { type: 'object', properties: { id: { type: 'string' }, registrationNo: { type: 'string' }, policeStationId: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      TukTukLastLocation: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          speed: { type: 'number', nullable: true },
          heading: { type: 'number', nullable: true },
          accuracy: { type: 'number', nullable: true },
          altitude: { type: 'number', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      TukTukNestedProvince: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
      TukTukNestedDistrict: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          province: { allOf: [{ $ref: '#/components/schemas/TukTukNestedProvince' }], nullable: true },
        },
      },
      TukTukNestedPoliceStation: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          district: { allOf: [{ $ref: '#/components/schemas/TukTukNestedDistrict' }], nullable: true },
        },
      },
      TukTukListItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          registrationNo: { type: 'string' },
          policeStation: { $ref: '#/components/schemas/TukTukNestedPoliceStation' },
          lastLocation: { $ref: '#/components/schemas/TukTukLastLocation' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TukTukFilteredMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          filters: {
            type: 'object',
            properties: {
              provinceId: { type: 'string', nullable: true },
              districtId: { type: 'string', nullable: true },
              policeStationId: { type: 'string', nullable: true },
            },
          },
        },
      },
      TukTukFilteredResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Filtered TukTuks retrieved successfully' },
          data: { type: 'array', items: { $ref: '#/components/schemas/TukTukListItem' } },
          meta: { $ref: '#/components/schemas/TukTukFilteredMeta' },
        },
      },
      Device: { type: 'object', properties: { id: { type: 'string' }, tuktukId: { type: 'string' }, revokedAt: { type: 'string', format: 'date-time', nullable: true }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } },
      DeviceCreate: { type: 'object', required: ['tuktukId'], properties: { tuktukId: { type: 'string' } } },
      DeviceRotateResponse: { type: 'object', properties: { apiKey: { type: 'string' } } },
      Location: { type: 'object', properties: { id: { type: 'string' }, tuktukId: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' }, speed: { type: 'number' }, heading: { type: 'number' }, accuracy: { type: 'number' }, altitude: { type: 'number' }, createdAt: { type: 'string', format: 'date-time' } } },
      LocationCreate: { type: 'object', required: ['tuktukId', 'latitude', 'longitude'], properties: { tuktukId: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' }, speed: { type: 'number' }, heading: { type: 'number' }, accuracy: { type: 'number' }, altitude: { type: 'number' } } },
      AuthLoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } },
      AuthLoginResponse: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } },
      MessageResponse: { type: 'object', properties: { message: { type: 'string' } } },
    },
  },
};

const paths = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login user and receive JWT',
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } }, required: true },
      responses: { 200: { description: 'Successful login', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginResponse' } } } }, 400: { $ref: '#/components/schemas/MessageResponse' }, 401: { $ref: '#/components/schemas/MessageResponse' } },
    },
  },
  '/auth/me': { get: { tags: ['Auth'], summary: 'Get current authenticated user', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Authenticated user' }, 401: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout (revoke token)', security: [{ bearerAuth: [] }], responses: { 200: { $ref: '#/components/schemas/MessageResponse' }, 401: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/users': { post: { tags: ['Users'], summary: 'Create user', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } }, required: true }, responses: { 201: { $ref: '#/components/schemas/User' }, 400: { $ref: '#/components/schemas/MessageResponse' } } }, get: { tags: ['Users'], summary: 'List users', security: [{ bearerAuth: [] }], responses: { 200: { type: 'array' } } } },
  '/users/{id}': { get: { tags: ['Users'], summary: 'Get user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/User' }, 404: { $ref: '#/components/schemas/MessageResponse' } } }, put: { tags: ['Users'], summary: 'Update user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } } } }, responses: { 200: { $ref: '#/components/schemas/User' } } }, delete: { tags: ['Users'], summary: 'Delete user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/policestations': { post: { tags: ['PoliceStation'], summary: 'Create police station', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name', 'districtId'], properties: { name: { type: 'string' }, districtId: { type: 'string' } } } } }, required: true }, responses: { 201: { $ref: '#/components/schemas/PoliceStation' } } }, get: { tags: ['PoliceStation'], summary: 'List police stations', security: [{ bearerAuth: [] }], responses: { 200: { type: 'array' } } } },
  '/policestations/{id}': { get: { tags: ['PoliceStation'], summary: 'Get police station', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/PoliceStation' } } }, put: { tags: ['PoliceStation'], summary: 'Update police station', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, districtId: { type: 'string' } } } } } }, responses: { 200: { $ref: '#/components/schemas/PoliceStation' } } }, delete: { tags: ['PoliceStation'], summary: 'Delete police station', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/devices': { post: { tags: ['Device'], summary: 'Create device', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/DeviceCreate' } } }, required: true }, responses: { 201: { $ref: '#/components/schemas/Device' } } } },
  '/devices/{id}/rotate': { post: { tags: ['Device'], summary: 'Rotate device API key', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/DeviceRotateResponse' } } } },
  '/devices/{id}/revoke': { post: { tags: ['Device'], summary: 'Revoke device', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/locations': { post: { tags: ['Location'], summary: 'Add location (device)', security: [{ ApiKeyAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LocationCreate' } } }, required: true }, responses: { 201: { $ref: '#/components/schemas/Location' } } } },
  '/locations/live': { get: { tags: ['Location'], summary: 'Get live locations', security: [{ bearerAuth: [] }], parameters: [{ name: 'tuktukId', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { 200: { type: 'array' } } } },
  '/locations/history': { get: { tags: ['Location'], summary: 'Get location history', security: [{ bearerAuth: [] }], parameters: [{ name: 'tuktukId', in: 'query', schema: { type: 'string' } }, { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { 200: { type: 'array' } } } },
  '/tuktuks': { post: { tags: ['TukTuk'], summary: 'Create tuktuk', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['registrationNo', 'policeStationId'], properties: { registrationNo: { type: 'string' }, policeStationId: { type: 'string' } } } } }, required: true }, responses: { 201: { $ref: '#/components/schemas/TukTuk' } } }, get: { tags: ['TukTuk'], summary: 'List tuktuks', security: [{ bearerAuth: [] }], parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { 200: { type: 'array' } } } },
  '/tuktuks/filters': {
    get: {
      tags: ['TukTuk'],
      summary: 'List tuktuks with geographic filters',
      description:
        'Returns TukTuks visible to the caller’s role, optionally narrowed by `provinceId`, `districtId`, and/or `policeStationId`. At least one filter is not required—all are optional; results are always intersected with the caller’s scope. **Roles:** `SUPER_ADMIN`, `PROVINCE_ADMIN`, `DISTRICT_ADMIN` only. Province admins cannot use a `provinceId` or `districtId` outside their province; district admins cannot use a `districtId` outside their district; any `policeStationId` must exist and lie within the caller’s scope.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'provinceId', in: 'query', required: false, description: 'Filter by province (stations in this province)', schema: { type: 'string' } },
        { name: 'districtId', in: 'query', required: false, description: 'Filter by district (stations in this district)', schema: { type: 'string' } },
        { name: 'policeStationId', in: 'query', required: false, description: 'Filter by police station', schema: { type: 'string' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: {
        200: {
          description: 'Paged list; may be empty if no TukTuks match filters within scope',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TukTukFilteredResponse' } } },
        },
        400: { description: 'Invalid query parameters', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
        403: {
          description: 'Filter outside your scope (e.g. wrong province or district for your role)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
        },
        404: {
          description: 'District or police station not found, or police station outside your scope',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
        },
      },
    },
  },
  '/tuktuks/{id}': { get: { tags: ['TukTuk'], summary: 'Get tuktuk', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/TukTuk' } } }, put: { tags: ['TukTuk'], summary: 'Update tuktuk', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { registrationNo: { type: 'string' }, policeStationId: { type: 'string' } } } } } }, responses: { 200: { $ref: '#/components/schemas/TukTuk' } } }, delete: { tags: ['TukTuk'], summary: 'Delete tuktuk', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { $ref: '#/components/schemas/MessageResponse' } } } },
  '/status/status': { get: { tags: ['Status'], summary: 'Get API status', responses: { 200: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } } } } } },
};

const options = { definition: { ...definition, paths }, apis: [] };

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
