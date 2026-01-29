# 01Blog 📝

01Blog is a **social blogging platform** designed for students to document and share their learning journey.  
Users can publish posts, interact with others, follow profiles, and engage in discussions, while administrators moderate content and manage users.

The project is built as a **fullstack application** using **Spring Boot** for the backend and **Angular** for the frontend.

---

## 📌 Overview

01Blog allows users to:
- Share posts with text and media (images/videos)
- Follow other users and receive notifications
- Like and comment on posts
- Report inappropriate content

Admins can:
- Manage users and posts
- Review reports
- Ban users or hide/delete posts

---

## 🎯 Learning Objectives

- Build REST APIs using **Java Spring Boot**
- Implement secure authentication and authorization
- Create dynamic UIs with **Angular**
- Design relational databases for social features
- Handle media uploads
- Apply role-based access control
- Collaborate using **Git & GitHub**

---

## 🛠 Technologies Used

### Backend
- Java 17+
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA / Hibernate
- PostgreSQL
- Maven

### Frontend
- Angular
- Angular Material
- TypeScript
- RxJS

### Tools & Others
- Git & GitHub
- RESTful APIs

---

## ⚙️ Project Structure

```

01blog/
│
├── backend/        # Spring Boot application
│   ├── controller
│   ├── service
│   ├── repository
│   ├── security
│   └── model
│
├── frontend/       # Angular application
│   ├── components
│   ├── services
│   ├── pages
│   └── guards
│
└── README.md

````

---

## 🚀 Features

### Authentication
- User registration & login
- Secure password hashing
- JWT-based authentication
- Role-based access (USER / ADMIN)

### Users & Profiles
- Public user profile (“block page”)
- Follow / unfollow users
- View posts by subscribed users

### Posts
- Create, edit, and delete posts
- Upload images or videos
- Like and comment on posts
- View timestamps and engagement stats

### Notifications
- Receive notifications from followed users
- Mark notifications as read/unread

### Reports
- Report users for inappropriate behavior
- Provide reason and timestamp
- Reports visible only to admins

### Admin Panel
- View and manage users
- Moderate posts
- Handle reports
- Ban or delete users

---

## ▶️ How to Run the Project

### 1️⃣ Backend Setup (Spring Boot)

```bash
cd backend
````

Configure `application.properties`:

```properties
spring.datasource.url=jdbc:db://localhost:port/01blog
spring.datasource.username=user
spring.datasource.password=password
jwt.secret=secret
```

Run the backend:

```bash
./mvnw spring-boot:run

```

Backend runs on:

```
http://localhost:8080
```

---

### 2️⃣ Frontend Setup (Angular)

```bash
cd frontend
npm install
ng serve
```

Frontend runs on:

```
http://localhost:4200
```

---

## 🔐 Security

* JWT-based authentication
* Role-based route protection
* Admin-only endpoints secured
* Unauthorized users redirected appropriately

---

## 📊 Evaluation Criteria

* ✅ Feature completeness
* 🔐 Security & access control
* 🎨 UI/UX quality
* 🧼 Code structure and readability

---


## 👨‍💻 Author

**Fahd Aguenouz**
Fullstack Developer – Spring Boot & Angular

---
