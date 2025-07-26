import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Site Director API',
    version: '1.0.0',
    description: 'REST API for web42-ai Site Director service',
    contact: {
      name: 'Site Director Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'name', 'authProvider', 'status'],
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB ObjectId',
            example: '68842630e5d48662e0313589',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name',
            example: 'Jane Doe',
          },
          authProvider: {
            type: 'string',
            enum: ['google', 'github', 'email'],
            description: 'Authentication provider',
            example: 'google',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'deleted'],
            description: 'User status',
            example: 'active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
            example: '2024-01-26T12:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
            example: '2024-01-26T12:00:00.000Z',
          },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'name', 'authProvider'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name',
            example: 'Jane Doe',
          },
          authProvider: {
            type: 'string',
            enum: ['google', 'github', 'email'],
            description: 'Authentication provider',
            example: 'google',
          },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'User full name',
            example: 'Jane Doe',
          },
          authProvider: {
            type: 'string',
            enum: ['google', 'github', 'email'],
            description: 'Authentication provider',
            example: 'google',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            description: 'User status (cannot set to deleted via update)',
            example: 'active',
          },
        },
      },
      UserListResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User',
            },
          },
          total: {
            type: 'integer',
            description: 'Total number of users matching the query',
            example: 100,
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Number of users per page',
            example: 10,
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
            example: 10,
          },
        },
      },
      UserStats: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of users',
            example: 100,
          },
          active: {
            type: 'integer',
            description: 'Number of active users',
            example: 80,
          },
          inactive: {
            type: 'integer',
            description: 'Number of inactive users',
            example: 15,
          },
          deleted: {
            type: 'integer',
            description: 'Number of deleted users',
            example: 5,
          },
          byAuthProvider: {
            type: 'object',
            description: 'User count by authentication provider',
            example: {
              google: 50,
              github: 30,
              email: 20,
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
            example: 'Validation failed',
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Email is required',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format',
                },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Not found',
                },
                message: {
                  type: 'string',
                  example: 'User not found',
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  example: 'Internal server error',
                },
                message: {
                  type: 'string',
                  example: 'Failed to process request',
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/users/userRoutes.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;