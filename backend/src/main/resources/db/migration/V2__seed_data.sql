-- Seed data for 01Blog

-- 1. Insert test users
INSERT INTO users (id, name, username, email, password, status, role, impressions_count, posts_count, readme, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'alice', 'alice@example.com', 'password123', 'active', 'ROLE_USER', 1500, 5, 'Learning Full Stack Development', CURRENT_TIMESTAMP - INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'bob', 'bob@example.com', 'password123', 'active', 'ROLE_USER', 2300, 8, 'Java Spring Boot enthusiast', CURRENT_TIMESTAMP - INTERVAL '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Charlie Brown', 'charlie', 'charlie@example.com', 'password123', 'active', 'ROLE_USER', 890, 3, 'Angular & TypeScript learner', CURRENT_TIMESTAMP - INTERVAL '20 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Diana Prince', 'diana', 'diana@example.com', 'password123', 'active', 'ROLE_USER', 3100, 12, 'Data structures and algorithms', CURRENT_TIMESTAMP - INTERVAL '15 days'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Eve Wilson', 'eve', 'eve@example.com', 'password123', 'active', 'ROLE_USER', 1200, 6, 'Web development journey', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Frank Davis', 'frank', 'frank@example.com', 'password123', 'active', 'ROLE_ADMIN', 5000, 20, 'Platform moderator', CURRENT_TIMESTAMP - INTERVAL '40 days');

-- 2. Insert media (placeholder images/videos)
INSERT INTO media (id, user_id, media_type, size, url, uploaded_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'image', 2048000, 'https://via.placeholder.com/600x400?text=Learning+React', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'image', 1524000, 'https://via.placeholder.com/600x400?text=Spring+Boot+API', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'image', 1800000, 'https://via.placeholder.com/600x400?text=Angular+Routing', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'image', 2200000, 'https://via.placeholder.com/600x400?text=Algorithm+Optimization', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'image', 1700000, 'https://via.placeholder.com/600x400?text=Web+Dev+Stack', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 3. Insert posts
INSERT INTO posts (id, user_id, title, body, status, likes_count, comments_count, impressions_count, created_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Getting Started with React Hooks', 'Today I learned about React Hooks and how they simplify state management. The useState and useEffect hooks are game-changers for functional components. No more class components for me! Key takeaways: Hooks make components more reusable, Custom hooks allow logic extraction, Performance is improved with proper dependencies. This is definitely going to speed up my development process.', 'active', 24, 5, 150, CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Building REST APIs with Spring Boot', 'I spent the last week building a REST API from scratch using Spring Boot. The framework makes it incredibly easy to create production-ready APIs with minimal boilerplate. What I covered: Creating controllers and services, Data validation with annotations, Exception handling, Security with JWT tokens. Spring Boot is definitely a game-changer for backend development!', 'active', 35, 8, 280, CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Angular Routing: A Complete Guide', 'Finally mastering Angular routing! Understanding the Router module and how to create a SPA has been enlightening. Topics covered: Router setup and configuration, Route guards for authentication, Lazy loading modules, Nested routes. My app now has proper navigation without page reloads. Loving it!', 'active', 18, 3, 120, CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Data Structures: Arrays vs Linked Lists', 'After spending hours on algorithm problems, I now fully understand when to use arrays vs linked lists. Key differences: Arrays have O(1) access but O(n) insertion/deletion, Linked Lists have O(n) access but O(1) insertion/deletion. The choice depends on your use case. Time to optimize my code!', 'active', 42, 12, 320, CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Full Stack Development Tips & Tricks', 'After 6 months of learning full stack development, here are my top tips: 1. Master one framework at a time, 2. Understand the HTTP protocol deeply, 3. Always consider security, 4. Write tests from the start, 5. Keep your database schema clean. These practices have saved me countless debugging hours!', 'active', 28, 6, 200, CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'TypeScript Generics Explained', 'Generics in TypeScript are powerful but confusing at first. Today I finally got them! Understanding: Generic functions and types, Constraints and extends keyword, Type inference, Utility types like Partial, Pick, Omit. My code is now more type-safe and reusable. No more "any" types!', 'active', 31, 7, 210, CURRENT_TIMESTAMP - INTERVAL '6 days'),
  ('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Database Design Best Practices', 'Spent the day optimizing our database schema. Here is what I learned: Best practices: Normalize data properly, Use appropriate indexes, Plan for scalability, Implement proper constraints, Document your schema. Good database design saves performance issues down the line.', 'active', 26, 4, 180, CURRENT_TIMESTAMP - INTERVAL '4 days');

-- 4. Insert post_media relationships
INSERT INTO post_media (post_id, media_id, created_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 5. Insert comments
INSERT INTO comments (id, user_id, post_id, text, created_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Great explanation of hooks! I will definitely use this in my next project.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'Custom hooks are so powerful. Thanks for the breakdown!', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Spring Boot is amazing! Did you add security to your API?', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  ('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'JWT authentication is the way to go. Nice work!', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  ('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 'Route guards saved me so much time. Thanks for sharing!', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004', 'Your explanation of complexity analysis is perfect!', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 6. Insert likes
INSERT INTO likes (id, user_id, post_id) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002'),
  ('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002'),
  ('990e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002'),
  ('990e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002');

-- 7. Insert subscriptions (users following each other)
INSERT INTO subscriptions (id, subscriber_id, subscribed_to_id, created_at) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '20 days'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP - INTERVAL '18 days'),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '15 days'),
  ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '12 days'),
  ('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  ('aa0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '8 days'),
  ('aa0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('aa0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 8. Insert reports (some reported content)
INSERT INTO reports (id, reporter_id, reported_user_id, reported_post_id, reported_comment_id, category, reason, status, created_at) VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', NULL, NULL, 'inappropriate_content', 'User is spamming the feed', 'waiting', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 9. Insert notifications
INSERT INTO notifications (id, user_id, post_id, type, payload, created_at) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'new_post_from_subscriber', '{"username": "bob", "post_title": "Building REST APIs with Spring Boot"}', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'new_post_from_subscriber', '{"username": "alice", "post_title": "Getting Started with React Hooks"}', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'new_comment', '{"username": "bob", "comment": "Spring Boot is amazing!"}', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  ('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'new_like', '{"username": "charlie", "post_title": "Getting Started with React Hooks"}', CURRENT_TIMESTAMP - INTERVAL '6 days');

-- 10. Insert unseen notifications
INSERT INTO unseen_notifications (id, user_id, notification_id, created_at) VALUES
  ('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('dd0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP - INTERVAL '4 days');
