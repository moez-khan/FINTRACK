# FinTrack - Personal Finance Management App

A modern, feature-rich personal finance management application built with Next.js 14, TypeScript, Prisma, and PostgreSQL. Track your income, expenses, and saving goals while following proven financial rules.

## Features

### Core Functionality
- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Transaction Management**: Track income and expenses with categories
- **Saving Goals**: Set and monitor SMART financial goals
- **Financial Rules**: Built-in support for popular budgeting methods
- **Data Visualization**: Interactive charts and progress tracking
- **Mobile Responsive**: Fully responsive design for all devices

### Financial Rules
1. **50/30/20 Rule**: Allocate 50% for needs, 30% for wants, 20% for savings
2. **Pay Yourself First**: Save a percentage of income before spending
3. **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound goals

### Visual Features
- Interactive pie charts for spending by category
- Line charts for income vs expenses over time
- Progress bars for budget tracking
- Circular progress indicators for goals
- Category icons for better visual organization

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with glass-morphism effects
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with JWT
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend Neon for cloud hosting)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fintrack.git
cd fintrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Generate with `openssl rand -base64 32` |

## Project Structure

```
fintrack/
├── app/
│   ├── api/           # API routes
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Main dashboard
│   └── layout.tsx     # Root layout
├── components/
│   ├── charts/        # Chart components
│   ├── Navbar.tsx     # Navigation bar
│   └── ...           # Other components
├── lib/
│   ├── auth.ts        # Authentication config
│   ├── prisma.ts      # Prisma client
│   ├── financeRules.ts # Financial calculations
│   └── categoryIcons.tsx # Icon mappings
├── prisma/
│   └── schema.prisma  # Database schema
└── public/            # Static assets
```

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses for user
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Saving Goals
- `GET /api/goals` - Get all saving goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Delete goal

### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile settings

## Database Schema

### User Model
- Email authentication
- Profile information
- Selected financial rule
- Savings percentage setting

### Expense Model
- Amount and type (income/expense)
- Category classification
- Date tracking
- Optional notes

### SavingGoal Model
- Goal name and target amount
- Current saved amount
- Deadline tracking
- Progress monitoring

## Features in Detail

### Dashboard
- Summary cards showing total income, expenses, balance, and monthly income
- Interactive charts for data visualization
- Financial rule widget with progress tracking
- Recent transactions table
- Saving goals overview

### Transaction Management
- Add income and expense transactions
- Categorize transactions (Groceries, Rent, Transport, etc.)
- Edit and delete existing transactions
- View transaction history

### Saving Goals
- Create SMART financial goals
- Track progress with visual indicators
- Edit goal details and saved amounts
- Automatic progress calculations

### Financial Rules
- Choose from three proven budgeting methods
- Real-time budget tracking
- Visual progress indicators
- Over-budget warnings

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- Passwords are hashed using bcrypt
- JWT tokens for session management
- Environment variables for sensitive data
- Input validation on all forms
- SQL injection prevention with Prisma

## Performance

- Server-side rendering for fast initial load
- Optimized images and assets
- Lazy loading for charts
- Efficient database queries
- Responsive design for all screen sizes

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify DATABASE_URL is correct
   - Check database is accessible
   - Run `npx prisma db push`

2. **Authentication issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Clear browser cookies

3. **Build errors**
   - Delete node_modules and package-lock.json
   - Run `npm install` again
   - Check Node.js version (18+)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting solutions
- Neon for PostgreSQL hosting
- All open-source contributors

---

Built with ❤️ using Next.js and TypeScript