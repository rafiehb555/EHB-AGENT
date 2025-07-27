import fs from 'fs';
import path from 'path';

interface APIConfig {
  name: string;
  service: string;
  routes: string[];
  auth: boolean;
  database: boolean;
  features: string[];
}

class BackendBuilderAgent {
  private routesPath: string;
  private controllersPath: string;
  private middlewaresPath: string;
  private modelsPath: string;
  private utilsPath: string;

  constructor() {
    this.routesPath = path.join(__dirname, '../backend/routes');
    this.controllersPath = path.join(__dirname, '../backend/controllers');
    this.middlewaresPath = path.join(__dirname, '../backend/middlewares');
    this.modelsPath = path.join(__dirname, '../backend/models');
    this.utilsPath = path.join(__dirname, '../backend/utils');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.routesPath, this.controllersPath, this.middlewaresPath, this.modelsPath, this.utilsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public generateAPI(config: APIConfig): void {
    this.generateRoutes(config);
    this.generateController(config);
    this.generateMiddleware(config);
    this.generateModels(config);
    this.generateServer();
  }

  private generateRoutes(config: APIConfig): string {
    const routeCode = `import express from 'express';
import { ${config.name}Controller } from '../controllers/${config.name.toLowerCase()}.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.get('/${config.name.toLowerCase()}', ${config.name}Controller.getAll);
router.get('/${config.name.toLowerCase()}/:id', ${config.name}Controller.getById);

${config.auth ? `// Protected routes
router.post('/${config.name.toLowerCase()}', verifyToken, ${config.name}Controller.create);
router.put('/${config.name.toLowerCase()}/:id', verifyToken, ${config.name}Controller.update);
router.delete('/${config.name.toLowerCase()}/:id', verifyToken, ${config.name}Controller.delete);` : ''}

export default router;`;

    const filePath = path.join(this.routesPath, `${config.name.toLowerCase()}.routes.ts`);
    fs.writeFileSync(filePath, routeCode);
    
    console.log(`✅ Routes generated: ${filePath}`);
    return filePath;
  }

  private generateController(config: APIConfig): string {
    const controllerCode = `import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ${config.name}Controller {
  static async getAll(req: Request, res: Response) {
    try {
      const ${config.name.toLowerCase()}s = await prisma.${config.name.toLowerCase()}.findMany();
      res.json(${config.name.toLowerCase()}s);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ${config.name.toLowerCase()} = await prisma.${config.name.toLowerCase()}.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!${config.name.toLowerCase()}) {
        return res.status(404).json({ message: '${config.name} not found' });
      }
      
      res.json(${config.name.toLowerCase()});
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  }

${config.auth ? `  static async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const ${config.name.toLowerCase()} = await prisma.${config.name.toLowerCase()}.create({
        data: {
          ...data,
          createdBy: (req as any).user.id
        }
      });
      res.status(201).json(${config.name.toLowerCase()});
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const ${config.name.toLowerCase()} = await prisma.${config.name.toLowerCase()}.update({
        where: { id: parseInt(id) },
        data
      });
      
      res.json(${config.name.toLowerCase()});
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.${config.name.toLowerCase()}.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ message: '${config.name} deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
  }` : ''}
}`;

    const filePath = path.join(this.controllersPath, `${config.name.toLowerCase()}.controller.ts`);
    fs.writeFileSync(filePath, controllerCode);
    
    console.log(`✅ Controller generated: ${filePath}`);
    return filePath;
  }

  private generateMiddleware(config: APIConfig): string {
    const authMiddlewareCode = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};`;

    const errorMiddlewareCode = `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};`;

    const authPath = path.join(this.middlewaresPath, 'auth.middleware.ts');
    const errorPath = path.join(this.middlewaresPath, 'error.middleware.ts');
    
    fs.writeFileSync(authPath, authMiddlewareCode);
    fs.writeFileSync(errorPath, errorMiddlewareCode);
    
    console.log(`✅ Middleware generated: ${authPath}, ${errorPath}`);
    return authPath;
  }

  private generateModels(config: APIConfig): string {
    const prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      String   // admin, franchise, user
  sqlLevel  String   // Free, Basic, Normal, High, VIP
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ${config.name} {
  id        Int      @id @default(autoincrement())
  name      String
  description String?
  status    String   @default("active") // active, inactive, pending
  createdBy Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("${config.name.toLowerCase()}")
}

model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Float
  description String?
  status    String   @default("active")
  createdBy Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Franchise {
  id        Int      @id @default(autoincrement())
  name      String
  type      String   // master, sub
  location  String?
  status    String   @default("active")
  createdBy Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;

    const schemaPath = path.join(this.modelsPath, 'schema.prisma');
    fs.writeFileSync(schemaPath, prismaSchema);
    
    console.log(`✅ Prisma schema generated: ${schemaPath}`);
    return schemaPath;
  }

  private generateServer(): string {
    const serverCode = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFound } from './middlewares/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import franchiseRoutes from './routes/franchise.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/franchises', franchiseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
});

export default app;`;

    const serverPath = path.join(__dirname, '../backend/server.ts');
    fs.writeFileSync(serverPath, serverCode);
    
    console.log(`✅ Server generated: ${serverPath}`);
    return serverPath;
  }

  public generateAuthRoutes(): string {
    const authRoutesCode = `import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', sqlLevel = 'Free' } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        sqlLevel
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sqlLevel: user.sqlLevel },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sqlLevel: user.sqlLevel
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sqlLevel: user.sqlLevel },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sqlLevel: user.sqlLevel
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sqlLevel: user.sqlLevel
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;`;

    const authPath = path.join(this.routesPath, 'auth.routes.ts');
    fs.writeFileSync(authPath, authRoutesCode);
    
    console.log(`✅ Auth routes generated: ${authPath}`);
    return authPath;
  }

  public generatePackageJson(): string {
    const packageJson = {
      name: "ehb-backend",
      version: "1.0.0",
      description: "EHB Backend API",
      main: "server.ts",
      scripts: {
        "start": "node dist/server.js",
        "dev": "nodemon server.ts",
        "build": "tsc",
        "db:push": "prisma db push",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate dev",
        "db:seed": "ts-node prisma/seed.ts"
      },
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "bcryptjs": "^2.4.3",
        "jsonwebtoken": "^9.0.2",
        "@prisma/client": "^5.7.1",
        "dotenv": "^16.3.1"
      },
      devDependencies: {
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        "@types/bcryptjs": "^2.4.6",
        "@types/jsonwebtoken": "^9.0.5",
        "@types/node": "^20.10.5",
        "typescript": "^5.3.3",
        "nodemon": "^3.0.2",
        "ts-node": "^10.9.2",
        "prisma": "^5.7.1"
      }
    };

    const packagePath = path.join(__dirname, '../backend/package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    
    console.log(`✅ Package.json generated: ${packagePath}`);
    return packagePath;
  }

  public generateEnvFile(): string {
    const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ehb_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV=development

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"

# Optional: External APIs
OPENAI_API_KEY="your-openai-api-key"
BLOCKCHAIN_RPC_URL="https://rpc.api.moonbeam.network"`;

    const envPath = path.join(__dirname, '../backend/.env.example');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`✅ Environment file generated: ${envPath}`);
    return envPath;
  }

  public generateServiceAPI(service: string): void {
    const config: APIConfig = {
      name: service.charAt(0).toUpperCase() + service.slice(1),
      service,
      routes: ['get', 'post', 'put', 'delete'],
      auth: true,
      database: true,
      features: ['crud', 'auth', 'validation']
    };

    this.generateAPI(config);
    console.log(`✅ Complete API generated for ${service}`);
  }
}

export default BackendBuilderAgent; 