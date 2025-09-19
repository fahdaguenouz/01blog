the structure to follow :
01blog/
│
├── backend/                # Spring Boot app
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/zone01/blog/
│   │   │   │   ├── controller/      # REST Controllers
│   │   │   │   ├── service/         # Business logic
│   │   │   │   ├── repository/      # JPA Repositories
│   │   │   │   ├── model/           # Entities (User, Post, Comment, etc.)
│   │   │   │   ├── security/        # JWT, SecurityConfig
│   │   │   │   └── BlogApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties (or application.yml)
│   │   │       └── static/ (if serving images)
│   │   └── test/java/...            # Unit & integration tests
│   └── pom.xml                      # Maven dependencies
│
├── frontend/               # Angular app
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/       # login, register components + services
│   │   │   ├── posts/      # feed, post detail, create/edit
│   │   │   ├── users/      # block pages, profiles
│   │   │   ├── admin/      # admin dashboard
│   │   │   ├── services/   # API calls (HttpClient)
│   │   │   ├── guards/     # AuthGuard, AdminGuard
│   │   │   └── app.module.ts
│   │   └── assets/
│   └── angular.json
│
└── README.md               # Documentation



to run the backend :
cd backend
./mvnw spring-boot:run

to run the frontend :
cd frontend
ng serve -o
