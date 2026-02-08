# User Card Management System

📌 Project Overview

This is a Node.js and MongoDB–based REST API designed for managing users, carts, and orders in an e-commerce–style system.
The API follows REST principles and supports secure authentication, authorization, and order processing.

🚀 Features

1. 👤 User Management

- User registration

- User login (JWT-based authentication)

- Reset password

- Update password

2. 🛍️ Cart Management

- Add items to cart

- Update cart items

- Remove items from cart

- View cart details

3. 📦 Order Management

- Place orders from the cart

- Apply coupons and discounts

- Order status tracking

## Deployment

- To clone this project

```bash
  git clone https://github.com/ShreyashSalian/usermanagement-with-cart-functionality.git
```

- Go to the folder user-authenication

```bash
  cd card-mangement
```

- Initialize Git (If Required)

```bash
  git init
```

- Install NPM Packages

```bash
  npm install
```

- Setup Environment Variables,
  PORT=5000,
  MONGODB_URI=your_mongodb_connection_string,
  ACCESS_TOKEN=your_jwt_access_secret,
  REFRESH_TOKEN=your_jwt_refresh_secret,

- Build the Project (Compile TypeScript). Compiles .ts files to .js inside the dist/ directory.

```bash
  npm run build
```

- Run the compiled version:

```bash
  npm run start
```

- Run Unit Tests
