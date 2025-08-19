# SME ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for Small and Medium Enterprises (SMEs). This modern, full-stack application provides essential business management features with a focus on Indian tax compliance and business requirements.

## 🚀 Features

### Core Modules
- **Dashboard & Analytics** - Real-time business insights and KPIs
- **Customer Management** - Complete customer relationship management
- **Supplier Management** - Vendor and procurement management
- **Product Management** - Inventory catalog with GST compliance
- **Inventory Control** - Stock tracking and warehouse management
- **Invoice Management** - GST-compliant invoicing with tax calculations
- **Purchase Orders** - Procurement and supplier order management
- **Employee Management** - HR and employee records
- **Payroll System** - Salary processing with statutory compliance (TDS, PF, ESI)
- **Accounting** - Chart of accounts and ledger management
- **Transaction Management** - Journal entries and financial records

### Key Features
- **Multi-currency Support** - Handle transactions in multiple currencies
- **Multi-user Access** - Role-based access control and permissions
- **Real-time Processing** - Live updates and notifications
- **Data Security** - JWT authentication and encrypted data
- **Tax Compliance** - Automated GST, TDS, and VAT calculations
- **Customization** - Configurable settings and preferences
- **Mobile Responsive** - Works seamlessly on all devices
- **Minimalistic UI/UX** - Clean, modern interface design

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management
- **React Router** for navigation
- **React Hook Form** for form handling
- **Heroicons** for icons
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **PostgreSQL** database
- **Prisma ORM** for database operations
- **JWT** for authentication
- **Socket.io** for real-time features
- **Zod** for validation
- **Helmet** for security

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sme-erp
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (client + server)
npm run install-all
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb sme_erp

# Copy environment file
cp server/env.example server/.env

# Update database URL in server/.env
DATABASE_URL="postgresql://username:password@localhost:5432/sme_erp"
```

### 4. Database Migration
```bash
cd server
npm run db:generate
npm run db:migrate
cd .. # Kembali ke direktori root
```

### 5. Start Development Servers
```bash
# Start both client and server
npm run dev

# Or start individually
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:3000
```

## 📁 Project Structure

```
sme-erp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── stores/        # State management
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── prisma/        # Database schema
│   └── uploads/           # File uploads
└── package.json           # Root package.json
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sme_erp"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000"

# Tax Configuration
GST_RATES="0,5,12,18,28"
TDS_RATES="1,2,5,10"
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎯 Key Features Explained

### GST Compliance
- Automatic GST calculation on invoices
- Support for different GST rates (0%, 5%, 12%, 18%, 28%)
- GST number validation and formatting
- Tax reporting and compliance

### Multi-currency Support
- Support for INR, USD, EUR, and other currencies
- Real-time exchange rate integration
- Multi-currency transaction recording

### Role-based Access
- **Super Admin** - Full system access
- **Admin** - Company-wide access
- **Manager** - Department-level access
- **Accountant** - Financial module access
- **HR** - Employee and payroll access
- **User** - Basic access

### Real-time Features
- Live dashboard updates
- Real-time notifications
- Collaborative editing
- Live chat support

## 📊 Database Schema

The system uses a comprehensive database schema with the following main entities:

- **Users** - Authentication and user management
- **Companies** - Multi-tenant organization support
- **Customers** - Customer relationship management
- **Suppliers** - Vendor management
- **Products** - Inventory catalog
- **Invoices** - Sales and billing
- **Purchase Orders** - Procurement
- **Employees** - HR management
- **Payroll** - Salary processing
- **Accounts** - Chart of accounts
- **Transactions** - Financial records

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration
- Secure file uploads

## 🧪 Testing

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test
```

## 📦 Deployment

### Production Build
```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Roadmap

### Phase 1 (Current)
- ✅ Core ERP modules
- ✅ Basic authentication
- ✅ Dashboard and analytics
- ✅ GST compliance

### Phase 2 (Planned)
- 🔄 Advanced reporting
- 🔄 Mobile app
- 🔄 API integrations
- 🔄 Advanced analytics

### Phase 3 (Future)
- 🔄 AI-powered insights
- 🔄 Advanced automation
- 🔄 Multi-language support
- 🔄 Advanced security features

---

