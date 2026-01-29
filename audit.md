#### General

###### Is the source code organized with a clear and logical folder structure?

###### Is a README file included with setup instructions and used technologies?

#### Functional

**_Ask the student to justify their answers and show the relevant implementation when needed._**

###### Is the project structured as a fullstack application with separate backend (Spring Boot) and frontend (Angular)?

###### Is the communication between frontend and backend done through REST APIs?

###### Is user authentication implemented using JWT or Spring Security?

###### Is role-based access control (admin/user) correctly enforced?

###### Are user sessions and authentication tokens securely managed?

###### Are all actions (posting, liking, commenting, subscribing, reporting) properly validated?

###### Is error handling present on both backend and frontend?

###### Are media files (images/videos) uploaded and stored securely?

###### Are posts created, edited, and deleted with appropriate access control?

###### Do users receive notifications when subscribed profiles publish posts?

#### Backend Logic & Security

###### Is the password stored using a hashing algorithm (e.g., BCrypt)?

###### Are database relationships (e.g., users, posts, comments, reports) correctly set up?

###### Are reports on profiles/posts saved with reasons and timestamps?

###### Are reports hidden from regular users and visible only to admins?

###### Is all input sanitized to prevent SQL injection or XSS attacks?

###### Are all admin-only routes protected by access control?

###### Can the admin delete or ban users and remove inappropriate posts?

###### Are notifications generated automatically when new posts are made?

#### Frontend (Angular)

###### Is the UI divided into Angular components with proper routing and services?

###### Is the UI responsive and mobile-friendly?

###### Are media uploads previewed before submission?

###### Are user roles reflected in the interface (admin tools not visible to regular users)?

###### Can users like, comment, and view posts smoothly?

###### Are all actions (post/report/subscribe) confirmed with visual feedback?

###### Is there a user-friendly UI for reporting users with a reason?

###### Is Angular Material or Bootstrap used for styling and components?

#### Post Interactions

###### Can users create, edit, and delete posts?

###### Are media, timestamps, likes, and comments shown on each post?

###### Can users like and comment on others' posts?

###### Are deleted posts and comments removed correctly from the interface?

###### Are uploaded files retrievable without corruption?

#### Admin Functionality

###### Can the admin view all users, posts, and submitted reports?

###### Can the admin delete or ban users?

###### Can the admin remove or hide posts?

###### Is there a dedicated admin dashboard with clear navigation?

###### Are admin actions confirmed before they take effect?

#### Testing and Stability

###### Is the app functional under multiple users?

###### Does the app handle edge cases (e.g., empty posts, invalid files, duplicate usernames)?

###### Is the browser console free of errors?

###### Are invalid routes or actions handled with proper error messages?

#### Bonus

###### +Does the platform support real-time updates (e.g., comments or notifications)?

###### +Is there infinite scrolling on the post feed?

###### +Is dark mode toggle available?

###### +Are basic admin analytics visible (e.g., number of posts, reported users)?

###### +Does the post editor support Markdown?