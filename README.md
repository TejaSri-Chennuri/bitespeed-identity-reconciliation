# Identity Reconciliation Backend
 This is a backend service built for identity reconciliation. It identifies and links contacts based on email and phone number. 
 --- ##  Tech Stack 
 - Node.js 
 - Express 
 - TypeScript 
 - Prisma ORM 
 - SQLite (for development) 
 --- ##  API Endpoint 
 ### POST /identify 
 #### Request Body 
 ```json 
 { "email": "string (optional)",
  "phoneNumber": "string (optional)"
 }