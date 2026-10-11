# Sahitya

A Next.js bookstore and library counter with two portals:

- **Admin** — inventory CRUD (add, view, update, delete books)
- **Front desk / customer portal** — browse stock, bill a customer, download a PDF

There are no sales graphs or analytics dashboards.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB. Either run it locally, use [MongoDB Atlas](https://www.mongodb.com/atlas), or:

```bash
docker compose up -d
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

Set `MONGODB_URI` if your database is not on `127.0.0.1:27017`.

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo logins

| Portal | Username | Password |
| --- | --- | --- |
| Admin inventory | `admin` | `admin123` |
| Front desk billing | `desk` | `desk123` |

The first successful database connection creates these users and a starter shelf of books.

## What each portal does

**Admin**

- See all titles, prices, and stock
- Add a book
- Edit details such as price and stock
- Delete a title

**Front desk**

- Search and add books to a bill
- Enter the customer name
- Save the bill (stock is reduced)
- Download a PDF invoice
