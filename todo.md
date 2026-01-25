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


to run the database container :

docker compose down -v
docker compose up -d

to run the new schema :

# Drop the entire schema just this engh for both 
docker exec -it 01blog-postgres psql -U 01blog -d 01blog -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"




# Now run V1 (schema)
cat src/main/resources/db/migration/V1__init.sql | docker exec -i 01blog-postgres psql -U 01blog -d 01blog

# Then run V2 (seed data)
cat src/main/resources/db/migration/V2__seed_data.sql | docker exec -i 01blog-postgres psql -U 01blog -d 01blog

List tables in the correct DB:

docker exec -it 01blog-postgres psql -U 01blog -d 01blog -c "\dt"

db link :
https://drawsql.app/teams/fahd-aguenouz/diagrams/01blog



the color combos :FF9D00
7B542F
B6771D
FFCF71