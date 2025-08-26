# FinTrack API Documentation

## Authentication
All API endpoints require authentication. The user must be logged in via NextAuth, and the session token will be automatically included in requests.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

---

## Expenses API

### 1. Get All Expenses
**GET** `/api/expenses`

Returns all expenses for the authenticated user.

**Response:**
```json
{
  "expenses": [
    {
      "id": "clxx123...",
      "amount": 150.00,
      "type": "expense",
      "category": "Groceries",
      "date": "2025-01-20T00:00:00Z",
      "notes": "Weekly shopping",
      "userId": "user123",
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### 2. Get Single Expense
**GET** `/api/expenses/{id}`

Returns a specific expense by ID.

**Response:**
```json
{
  "expense": {
    "id": "clxx123...",
    "amount": 150.00,
    "type": "expense",
    "category": "Groceries",
    "date": "2025-01-20T00:00:00Z",
    "notes": "Weekly shopping",
    "userId": "user123"
  }
}
```

### 3. Create Expense
**POST** `/api/expenses`

Creates a new expense or income entry.

**Request Body:**
```json
{
  "amount": 150.00,
  "type": "expense",  // "income" or "expense"
  "category": "Groceries",
  "date": "2025-01-20",
  "notes": "Weekly shopping"  // optional
}
```

**Validation Rules:**
- `amount`: Required, must be positive number
- `type`: Required, must be "income" or "expense"
- `category`: Required, string
- `date`: Required, valid date format
- `notes`: Optional, string

**Response:**
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": "clxx123...",
    "amount": 150.00,
    "type": "expense",
    "category": "Groceries",
    "date": "2025-01-20T00:00:00Z",
    "notes": "Weekly shopping",
    "userId": "user123"
  }
}
```

### 4. Update Expense
**PUT** `/api/expenses/{id}`

Updates an existing expense. All fields are optional.

**Request Body:**
```json
{
  "amount": 175.00,
  "type": "expense",
  "category": "Food & Dining",
  "date": "2025-01-21",
  "notes": "Updated note"
}
```

**Response:**
```json
{
  "message": "Expense updated successfully",
  "expense": {
    "id": "clxx123...",
    "amount": 175.00,
    "type": "expense",
    "category": "Food & Dining",
    "date": "2025-01-21T00:00:00Z",
    "notes": "Updated note",
    "userId": "user123"
  }
}
```

### 5. Delete Expense
**DELETE** `/api/expenses/{id}`

Deletes an expense.

**Response:**
```json
{
  "message": "Expense deleted successfully"
}
```

---

## Saving Goals API

### 1. Get All Saving Goals
**GET** `/api/saving-goals`

Returns all saving goals for the authenticated user.

**Response:**
```json
{
  "savingGoals": [
    {
      "id": "clxx456...",
      "name": "Emergency Fund",
      "target": 5000.00,
      "saved": 1250.00,
      "deadline": "2025-12-31T00:00:00Z",
      "userId": "user123",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### 2. Get Single Saving Goal
**GET** `/api/saving-goals/{id}`

Returns a specific saving goal by ID.

**Response:**
```json
{
  "savingGoal": {
    "id": "clxx456...",
    "name": "Emergency Fund",
    "target": 5000.00,
    "saved": 1250.00,
    "deadline": "2025-12-31T00:00:00Z",
    "userId": "user123"
  }
}
```

### 3. Create Saving Goal
**POST** `/api/saving-goals`

Creates a new saving goal.

**Request Body:**
```json
{
  "name": "Vacation Fund",
  "target": 3000.00,
  "saved": 500.00,  // optional, defaults to 0
  "deadline": "2025-06-30"
}
```

**Validation Rules:**
- `name`: Required, string
- `target`: Required, must be positive number
- `saved`: Optional, must be non-negative number and not exceed target
- `deadline`: Required, must be a future date

**Response:**
```json
{
  "message": "Saving goal created successfully",
  "savingGoal": {
    "id": "clxx789...",
    "name": "Vacation Fund",
    "target": 3000.00,
    "saved": 500.00,
    "deadline": "2025-06-30T00:00:00Z",
    "userId": "user123"
  }
}
```

### 4. Update Saving Goal
**PUT** `/api/saving-goals/{id}`

Updates an existing saving goal. All fields are optional.

**Request Body:**
```json
{
  "name": "Summer Vacation",
  "target": 3500.00,
  "saved": 1000.00,
  "deadline": "2025-07-15"
}
```

**Validation Rules:**
- `saved` cannot exceed `target`
- If updating both, the new saved amount cannot exceed the new target

**Response:**
```json
{
  "message": "Saving goal updated successfully",
  "savingGoal": {
    "id": "clxx789...",
    "name": "Summer Vacation",
    "target": 3500.00,
    "saved": 1000.00,
    "deadline": "2025-07-15T00:00:00Z",
    "userId": "user123"
  }
}
```

### 5. Delete Saving Goal
**DELETE** `/api/saving-goals/{id}`

Deletes a saving goal.

**Response:**
```json
{
  "message": "Saving goal deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to perform operation"
}
```

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Create an expense
const createExpense = async () => {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 50,
      type: 'expense',
      category: 'Transportation',
      date: new Date().toISOString(),
      notes: 'Uber ride'
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Get all expenses
const getExpenses = async () => {
  const response = await fetch('/api/expenses');
  const data = await response.json();
  console.log(data.expenses);
};

// Update a saving goal
const updateSavingGoal = async (goalId: string) => {
  const response = await fetch(`/api/saving-goals/${goalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      saved: 1500 // Update saved amount
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

### cURL Examples

```bash
# Get all expenses (requires session cookie)
curl -X GET http://localhost:3000/api/expenses \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create a new expense
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "amount": 100,
    "type": "expense",
    "category": "Shopping",
    "date": "2025-01-22",
    "notes": "Clothes shopping"
  }'

# Update a saving goal
curl -X PUT http://localhost:3000/api/saving-goals/GOAL_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "saved": 2000
  }'

# Delete an expense
curl -X DELETE http://localhost:3000/api/expenses/EXPENSE_ID \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Notes

1. All endpoints require authentication via NextAuth session
2. Users can only access their own data (enforced by userId check)
3. All monetary values are stored as floats
4. Dates should be provided in ISO 8601 format
5. The API automatically adds timestamps (createdAt, updatedAt) to all records
6. Input validation is performed on all endpoints to ensure data integrity