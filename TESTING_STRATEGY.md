# COMPREHENSIVE TESTING STRATEGY

## 🎯 **CURRENT TESTING STATE**

### **Critical Issues:**
- **Zero Test Coverage**: No automated tests exist
- **No Testing Framework**: No testing infrastructure in place
- **Manual Testing Only**: Prone to human error and inconsistency
- **No CI/CD Integration**: No automated quality gates
- **No Performance Testing**: Unknown performance characteristics
- **No Security Testing**: Vulnerabilities undetected

## 🧪 **PROPOSED TESTING PYRAMID**

```
                    E2E Tests (10%)
                 ┌─────────────────┐
                 │   User Journeys │
                 │   Integration   │
                 └─────────────────┘
              
              Integration Tests (20%)
           ┌─────────────────────────┐
           │   API Endpoints         │
           │   Database Integration  │
           │   External Services     │
           └─────────────────────────┘
        
        Unit Tests (70%)
    ┌─────────────────────────────────┐
    │   Business Logic                │
    │   Use Cases                     │
    │   Components                    │
    │   Utilities                     │
    └─────────────────────────────────┘
```

## 🔧 **TESTING FRAMEWORK SETUP**

### **Backend Testing (Node.js + Jest + Supertest)**

#### **Package Configuration:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.1",
    "jest-extended": "^4.0.0",
    "testcontainers": "^9.8.0",
    "@testcontainers/mysql": "^10.0.0",
    "faker": "^6.6.6",
    "sinon": "^15.1.0",
    "nock": "^13.3.1"
  }
}
```

#### **Jest Configuration:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/main.js',
    '!src/infrastructure/database/migrations/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: '50%'
};
```

### **Frontend Testing (Jest + Testing Library)**

#### **Frontend Test Configuration:**
```json
{
  "scripts": {
    "test:frontend": "jest --config jest.frontend.config.js",
    "test:frontend:watch": "jest --config jest.frontend.config.js --watch",
    "test:frontend:coverage": "jest --config jest.frontend.config.js --coverage"
  },
  "devDependencies": {
    "@testing-library/dom": "^9.3.0",
    "@testing-library/user-event": "^14.4.3",
    "jest-environment-jsdom": "^29.5.0",
    "msw": "^1.2.1"
  }
}
```

## 🧪 **UNIT TESTING EXAMPLES**

### **Backend Unit Tests:**

#### **Use Case Testing:**
```javascript
// tests/unit/use-cases/auth/LoginUseCase.test.js
const LoginUseCase = require('../../../../src/application/use-cases/auth/LoginUseCase');
const User = require('../../../../src/domain/entities/User');
const AuthenticationError = require('../../../../src/shared/errors/AuthenticationError');

describe('LoginUseCase', () => {
  let loginUseCase;
  let mockUserRepository;
  let mockPasswordService;
  let mockTokenService;
  let mockLogger;

  beforeEach(() => {
    mockUserRepository = {
      findByUsername: jest.fn()
    };
    mockPasswordService = {
      verify: jest.fn()
    };
    mockTokenService = {
      generate: jest.fn()
    };
    mockLogger = {
      logAuthEvent: jest.fn()
    };

    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockPasswordService,
      mockTokenService,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginDto = {
        username: 'testuser',
        password: 'SecurePass123!'
      };

      const user = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'USER',
        permissions: ['READ_REFERENCES']
      });

      const token = 'jwt.token.here';

      mockUserRepository.findByUsername.mockResolvedValue(user);
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenService.generate.mockResolvedValue(token);

      // Act
      const result = await loginUseCase.execute(loginDto);

      // Assert
      expect(result).toEqual({
        token,
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        })
      });

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('SecurePass123!', 'hashed_password');
      expect(mockTokenService.generate).toHaveBeenCalledWith(user);
      expect(mockLogger.logAuthEvent).toHaveBeenCalledWith(1, 'LOGIN_SUCCESS');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const loginDto = {
        username: 'nonexistent',
        password: 'password'
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(loginDto))
        .rejects.toThrow(AuthenticationError);

      expect(mockLogger.logAuthEvent)
        .toHaveBeenCalledWith('nonexistent', 'LOGIN_FAILED', expect.any(Object));
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const user = new User({
        id: 1,
        username: 'testuser',
        passwordHash: 'hashed_password'
      });

      mockUserRepository.findByUsername.mockResolvedValue(user);
      mockPasswordService.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUseCase.execute(loginDto))
        .rejects.toThrow(AuthenticationError);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const loginDto = {
        username: 'testuser',
        password: 'password'
      };

      mockUserRepository.findByUsername.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(loginUseCase.execute(loginDto))
        .rejects.toThrow('Database error');

      expect(mockLogger.logAuthEvent)
        .toHaveBeenCalledWith('testuser', 'LOGIN_FAILED', expect.any(Object));
    });
  });
});
```

#### **Entity Testing:**
```javascript
// tests/unit/domain/entities/User.test.js
const User = require('../../../../src/domain/entities/User');
const ValidationError = require('../../../../src/shared/errors/ValidationError');

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create user with valid data', () => {
      // Arrange
      const userData = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        permissions: ['READ_REFERENCES']
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('USER');
      expect(user.permissions).toEqual(['READ_REFERENCES']);
    });

    it('should throw error with invalid username', () => {
      // Arrange
      const userData = {
        id: 1,
        username: 'ab', // Too short
        email: 'test@example.com'
      };

      // Act & Assert
      expect(() => new User(userData))
        .toThrow(ValidationError);
    });

    it('should throw error with invalid email', () => {
      // Arrange
      const userData = {
        id: 1,
        username: 'testuser',
        email: 'invalid-email'
      };

      // Act & Assert
      expect(() => new User(userData))
        .toThrow(ValidationError);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', () => {
      // Arrange
      const user = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        permissions: ['READ_REFERENCES', 'WRITE_REFERENCES']
      });

      // Act & Assert
      expect(user.hasPermission('READ_REFERENCES')).toBe(true);
      expect(user.hasPermission('WRITE_REFERENCES')).toBe(true);
    });

    it('should return false when user does not have permission', () => {
      // Arrange
      const user = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        permissions: ['READ_REFERENCES']
      });

      // Act & Assert
      expect(user.hasPermission('ADMIN_ACCESS')).toBe(false);
    });
  });

  describe('canAccessReference', () => {
    it('should allow access with READ_REFERENCES permission', () => {
      // Arrange
      const user = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        permissions: ['READ_REFERENCES'],
        clientId: 123
      });

      // Act & Assert
      expect(user.canAccessReference('REF001')).toBe(true);
    });

    it('should allow access to own client references', () => {
      // Arrange
      const user = new User({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        permissions: [],
        clientId: 123
      });

      // Mock the method that gets client ID from reference
      user.getClientIdFromReference = jest.fn().mockReturnValue(123);

      // Act & Assert
      expect(user.canAccessReference('REF001')).toBe(true);
    });
  });
});
```

### **Frontend Unit Tests:**

#### **Component Testing:**
```javascript
// tests/unit/components/LoginForm.test.js
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { LoginForm } from '../../../src/components/forms/LoginForm';
import { AuthService } from '../../../src/services/AuthService';

// Mock services
jest.mock('../../../src/services/AuthService');

describe('LoginForm Component', () => {
  let container;
  let mockAuthService;
  let mockRouter;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockAuthService = {
      login: jest.fn()
    };
    mockRouter = {
      navigate: jest.fn()
    };

    AuthService.mockImplementation(() => mockAuthService);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    // Act
    new LoginForm(container, mockAuthService, mockRouter);

    // Assert
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should submit form with valid credentials', async () => {
    // Arrange
    mockAuthService.login.mockResolvedValue({ success: true });
    new LoginForm(container, mockAuthService, mockRouter);

    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show validation errors for empty fields', async () => {
    // Arrange
    new LoginForm(container, mockAuthService, mockRouter);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/usuario es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/contraseña es requerida/i)).toBeInTheDocument();
    });
  });

  it('should handle login errors gracefully', async () => {
    // Arrange
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
    new LoginForm(container, mockAuthService, mockRouter);

    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Act
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

## 🔗 **INTEGRATION TESTING**

### **API Integration Tests:**
```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const { app } = require('../../src/main');
const { setupTestDatabase, cleanupTestDatabase } = require('../helpers/database');

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'SecurePass123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: {
          token: expect.any(String),
          user: {
            id: expect.any(Number),
            username: 'testuser',
            email: expect.any(String),
            role: expect.any(String)
          }
        }
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should rate limit login attempts', async () => {
      // Arrange
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      // Act - Make 6 failed attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(credentials);
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(429);

      // Assert
      expect(response.body.error).toContain('Too many login attempts');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      // Arrange
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'SecurePass123!'
        });

      const token = loginResponse.body.data.token;

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});
```

### **Database Integration Tests:**
```javascript
// tests/integration/repositories/UserRepository.test.js
const { PrismaClient } = require('@prisma/client');
const PrismaUserRepository = require('../../../src/infrastructure/database/repositories/PrismaUserRepository');
const User = require('../../../src/domain/entities/User');

describe('PrismaUserRepository', () => {
  let prisma;
  let repository;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL
        }
      }
    });
    repository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.bP_01_USUARIO.deleteMany();
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      // Arrange
      await prisma.bP_01_USUARIO.create({
        data: {
          sNombre: 'Test',
          sApellidoPaterno: 'User',
          sApellidoMaterno: 'Test',
          sUsuario: 'testuser',
          sEmail: 'test@example.com',
          sPassword: 'hashedpassword',
          bActivo: true
        }
      });

      // Act
      const user = await repository.findByUsername('testuser');

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      // Act
      const user = await repository.findByUsername('nonexistent');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('save', () => {
    it('should save new user', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        passwordHash: 'hashedpassword'
      };

      const user = new User(userData);

      // Act
      const savedUser = await repository.save(user);

      // Assert
      expect(savedUser.id).toBeDefined();
      expect(savedUser.username).toBe('newuser');

      // Verify in database
      const dbUser = await prisma.bP_01_USUARIO.findUnique({
        where: { sUsuario: 'newuser' }
      });
      expect(dbUser).toBeDefined();
    });
  });
});
```

## 🌐 **END-TO-END TESTING**

### **E2E Test Setup with Playwright:**
```javascript
// tests/e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange
    await expect(page.locator('h1')).toContainText('E-Clientes');

    // Act
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page).toHaveURL('/dashboard.html');
    await expect(page.locator('.user-name')).toContainText('Test User');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Act
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('.error-message')).toContainText('Credenciales inválidas');
  });

  test('should validate required fields', async ({ page }) => {
    // Act
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('#username-error')).toContainText('Usuario es requerido');
    await expect(page.locator('#password-error')).toContainText('Contraseña es requerida');
  });

  test('should handle loading states', async ({ page }) => {
    // Arrange - Mock slow API response
    await page.route('/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { token: 'test-token', user: { username: 'testuser' } }
        })
      });
    });

    // Act
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('button[type="submit"]')).toHaveClass(/loading/);
    await expect(page.locator('.spinner')).toBeVisible();
  });
});
```

## 🚀 **PERFORMANCE TESTING**

### **Load Testing with Artillery:**
```yaml
# tests/performance/load-test.yml
config:
  target: 'https://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Login and browse references"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "SecurePass123!"
          capture:
            header: "set-cookie"
            as: "sessionCookie"
      - get:
          url: "/api/references"
          headers:
            Cookie: "{{ sessionCookie }}"
      - post:
          url: "/api/auth/logout"
          headers:
            Cookie: "{{ sessionCookie }}"

  - name: "Search references"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "SecurePass123!"
          capture:
            header: "set-cookie"
            as: "sessionCookie"
      - get:
          url: "/api/references/search?q=container"
          headers:
            Cookie: "{{ sessionCookie }}"
```

## 🔒 **SECURITY TESTING**

### **Security Test Examples:**
```javascript
// tests/security/auth-security.test.js
const request = require('supertest');
const { app } = require('../../src/main');

describe('Authentication Security', () => {
  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login', async () => {
      // Arrange
      const maliciousPayload = {
        username: "admin'; DROP TABLE users; --",
        password: "password"
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).not.toContain('SQL');
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize user input', async () => {
      // Arrange
      const xssPayload = {
        username: "<script>alert('xss')</script>",
        password: "password"
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(xssPayload);

      // Assert
      expect(response.body).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Act - Make multiple requests rapidly
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'test' })
      );

      const responses = await Promise.all(requests);

      // Assert
      const tooManyRequests = responses.filter(r => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
```

## 🤖 **AUTOMATED TESTING PIPELINE**

### **GitHub Actions CI/CD:**
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        TEST_DATABASE_URL: mysql://root:test@localhost:3306/test_db
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run integration tests
      run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install
    
    - name: Start application
      run: npm start &
    
    - name: Wait for app to start
      run: npx wait-on http://localhost:3000
    
    - name: Run E2E tests
      run: npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run OWASP ZAP scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'http://localhost:3000'
```

## 📊 **TEST COVERAGE & REPORTING**

### **Coverage Configuration:**
```javascript
// jest.coverage.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/main.js',
    '!src/infrastructure/database/migrations/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/domain/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/application/use-cases/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json-summary'
  ]
};
```

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1: Foundation (Week 1)**
1. Set up Jest and testing infrastructure
2. Create test helpers and utilities
3. Write first unit tests for critical use cases
4. Set up basic CI pipeline

### **Phase 2: Core Testing (Week 2-3)**
1. Complete unit tests for domain entities
2. Add integration tests for API endpoints
3. Create database integration tests
4. Set up test data factories

### **Phase 3: End-to-End Testing (Week 4)**
1. Set up Playwright for E2E tests
2. Create user journey tests
3. Add performance testing
4. Implement visual regression testing

### **Phase 4: Advanced Testing (Week 5)**
1. Add security testing
2. Set up mutation testing
3. Create load testing scenarios
4. Implement monitoring and alerting

## 📋 **TESTING CHECKLIST**

- [ ] Unit tests for all use cases
- [ ] Unit tests for domain entities
- [ ] Integration tests for API endpoints
- [ ] Database integration tests
- [ ] Frontend component tests
- [ ] End-to-end user journey tests
- [ ] Performance and load tests
- [ ] Security tests
- [ ] Test coverage > 80%
- [ ] CI/CD pipeline with automated tests
- [ ] Test documentation and guidelines

This comprehensive testing strategy will ensure high code quality, catch bugs early, and provide confidence in deployments while maintaining the ability to refactor and improve the codebase safely.