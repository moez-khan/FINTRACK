# Database Setup - Neon PostgreSQL

## Prerequisites
1. Create a Neon account at https://neon.tech
2. Create a new project in Neon dashboard

## Configuration Steps

1. **Get your connection string:**
   - Go to your Neon dashboard
   - Navigate to your project
   - Click on "Connection Details" or "Connection String"
   - Copy the connection string

2. **Update .env file:**
   - Open `.env` file in the project root
   - Replace the `DATABASE_URL` with your Neon connection string
   - Your connection string should look like:
     ```
     DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require"
     ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

6. **Verify connection:**
   ```bash
   npx prisma studio
   ```
   This will open Prisma Studio at http://localhost:5555 where you can view and manage your data.

## Database Schema

The database includes three main tables:

- **User**: Stores user information (email, password, selectedRule)
- **Expense**: Tracks income and expenses with categories
- **SavingGoal**: Manages saving goals with targets and deadlines

All relationships are properly configured with cascading deletes for data integrity.