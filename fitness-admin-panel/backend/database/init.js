const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'fitness.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('Database schema created successfully!');

// Seed initial data
const seedData = () => {
  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const trainerPassword = bcrypt.hashSync('trainer123', 10);
  const memberPassword = bcrypt.hashSync('member123', 10);

  // Insert membership plans
  const plans = [
    ['Basic', 'Access to gym facilities and basic classes', 29.99, 1, 'Gym access,Basic classes,Locker room'],
    ['Premium', 'Full access including all classes and nutrition plans', 59.99, 1, 'All Basic features,All classes,Nutrition plans,Personal dashboard'],
    ['Elite', 'VIP access with personal training sessions', 99.99, 1, 'All Premium features,2 PT sessions/month,Priority booking,Exclusive content'],
    ['Annual Basic', 'Basic plan with annual discount', 299.99, 12, 'All Basic features,2 months free'],
    ['Annual Premium', 'Premium plan with annual discount', 599.99, 12, 'All Premium features,2 months free']
  ];

  const insertPlan = db.prepare('INSERT INTO membership_plans (name, description, price, duration_months, features) VALUES (?, ?, ?, ?, ?)');
  plans.forEach(plan => insertPlan.run(...plan));

  // Insert users
  const insertUser = db.prepare(`
    INSERT INTO users (email, password, first_name, last_name, role, phone, membership_status, membership_plan_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin@fitnesshub.com', adminPassword, 'Sarah', 'Admin', 'admin', '555-0100', 'active', null);
  insertUser.run('trainer@fitnesshub.com', trainerPassword, 'Emily', 'Johnson', 'trainer', '555-0101', 'active', null);
  insertUser.run('trainer2@fitnesshub.com', trainerPassword, 'Jessica', 'Williams', 'trainer', '555-0102', 'active', null);
  insertUser.run('member@fitnesshub.com', memberPassword, 'Amanda', 'Smith', 'member', '555-0103', 'active', 2);
  insertUser.run('member2@fitnesshub.com', memberPassword, 'Rachel', 'Brown', 'member', '555-0104', 'active', 3);
  insertUser.run('member3@fitnesshub.com', memberPassword, 'Michelle', 'Davis', 'member', '555-0105', 'active', 1);

  // Insert fitness classes
  const classes = [
    ['Morning Yoga Flow', 'Start your day with energizing yoga sequences', 'yoga', 2, 20, 60],
    ['Power Pilates', 'Core-strengthening pilates workout', 'pilates', 3, 15, 45],
    ['HIIT Burn', 'High-intensity interval training for maximum calorie burn', 'hiit', 2, 25, 30],
    ['Strength Training', 'Build lean muscle with weight training', 'strength', 3, 12, 60],
    ['Zumba Dance', 'Fun dance fitness party', 'dance', 2, 30, 45],
    ['Spin Class', 'Indoor cycling for cardio endurance', 'cycling', 3, 20, 45]
  ];

  const insertClass = db.prepare(`
    INSERT INTO fitness_classes (name, description, class_type, instructor_id, max_capacity, duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  classes.forEach(cls => insertClass.run(...cls));

  // Insert workout programs
  const programs = [
    ['Beginner Full Body', '4-week program for fitness beginners', 'beginner', 4, 'full-body', 2],
    ['Lean & Tone', '6-week toning program', 'intermediate', 6, 'toning', 2],
    ['Strength Builder', '8-week strength training program', 'advanced', 8, 'strength', 3],
    ['Post-Pregnancy Recovery', 'Gentle program for new mothers', 'beginner', 8, 'recovery', 2],
    ['Beach Body Ready', '12-week transformation program', 'intermediate', 12, 'transformation', 3]
  ];

  const insertProgram = db.prepare(`
    INSERT INTO workout_programs (title, description, difficulty, duration_weeks, category, trainer_id, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  programs.forEach(prog => insertProgram.run(...prog));

  // Insert exercises
  const exercises = [
    ['Squats', 'Lower body compound exercise', 'legs', 'none', 'Stand with feet shoulder-width apart, lower your hips back and down'],
    ['Push-ups', 'Upper body pushing exercise', 'chest', 'none', 'Start in plank position, lower chest to floor, push back up'],
    ['Lunges', 'Single-leg exercise for balance and strength', 'legs', 'none', 'Step forward, lower back knee toward floor'],
    ['Plank', 'Core stabilization exercise', 'core', 'none', 'Hold body in straight line from head to heels'],
    ['Deadlift', 'Full body pulling exercise', 'back', 'barbell', 'Hinge at hips, grip bar, stand up straight'],
    ['Bicep Curls', 'Arm isolation exercise', 'arms', 'dumbbells', 'Curl weights toward shoulders'],
    ['Mountain Climbers', 'Cardio core exercise', 'core', 'none', 'Alternate bringing knees to chest in plank position'],
    ['Burpees', 'Full body cardio exercise', 'full-body', 'none', 'Squat, jump back to plank, push-up, jump forward, jump up']
  ];

  const insertExercise = db.prepare(`
    INSERT INTO exercises (name, description, muscle_group, equipment, instructions)
    VALUES (?, ?, ?, ?, ?)
  `);
  exercises.forEach(ex => insertExercise.run(...ex));

  // Insert articles
  const articles = [
    ['10 Tips for Beginners', '10-tips-beginners', 'Starting your fitness journey can be overwhelming. Here are 10 essential tips...', 'fitness', 1],
    ['Nutrition for Muscle Building', 'nutrition-muscle-building', 'Learn how to fuel your body for optimal muscle growth...', 'nutrition', 1],
    ['Benefits of Morning Workouts', 'morning-workout-benefits', 'Discover why exercising in the morning can transform your day...', 'wellness', 1],
    ['Home Workout Guide', 'home-workout-guide', 'No gym? No problem! Here is your complete guide to effective home workouts...', 'fitness', 1],
    ['Stress Relief Through Exercise', 'stress-relief-exercise', 'How physical activity can help manage stress and anxiety...', 'wellness', 1]
  ];

  const insertArticle = db.prepare(`
    INSERT INTO articles (title, slug, content, category, author_id, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `);
  articles.forEach(art => insertArticle.run(...art));

  // Insert nutrition plans
  const nutritionPlans = [
    ['Weight Loss Plan', 'Calorie-deficit meal plan for healthy weight loss', 1500, 120, 150, 50, 5, 'balanced', 1],
    ['Muscle Gain Plan', 'High-protein plan for muscle building', 2200, 180, 220, 70, 6, 'high-protein', 1],
    ['Vegetarian Fitness', 'Plant-based nutrition for active lifestyle', 1800, 100, 200, 60, 5, 'vegetarian', 1]
  ];

  const insertNutrition = db.prepare(`
    INSERT INTO nutrition_plans (title, description, calories_target, protein_target, carbs_target, fat_target, meal_count, diet_type, created_by, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  nutritionPlans.forEach(plan => insertNutrition.run(...plan));

  // Insert products
  const products = [
    ['Yoga Mat', 'Premium non-slip yoga mat', 39.99, null, 50, 'equipment'],
    ['Resistance Bands Set', '5 resistance bands with different strengths', 24.99, 19.99, 100, 'equipment'],
    ['Water Bottle', 'BPA-free 32oz water bottle', 19.99, null, 200, 'accessories'],
    ['Fitness Tracker', 'Track steps, heart rate, and calories', 89.99, 79.99, 30, 'electronics'],
    ['Protein Powder', 'Whey protein isolate 2lb', 49.99, null, 75, 'supplements'],
    ['Gym Bag', 'Spacious gym bag with shoe compartment', 44.99, null, 40, 'accessories']
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, sale_price, stock_quantity, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  products.forEach(prod => insertProduct.run(...prod));

  // Insert some class schedules
  const now = new Date();
  const schedules = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Morning class
    const morning = new Date(date);
    morning.setHours(7, 0, 0, 0);
    const morningEnd = new Date(morning);
    morningEnd.setMinutes(morningEnd.getMinutes() + 60);
    schedules.push([1, 2, morning.toISOString(), morningEnd.toISOString(), 'Studio A', 20]);

    // Afternoon class
    const afternoon = new Date(date);
    afternoon.setHours(12, 0, 0, 0);
    const afternoonEnd = new Date(afternoon);
    afternoonEnd.setMinutes(afternoonEnd.getMinutes() + 45);
    schedules.push([3, 2, afternoon.toISOString(), afternoonEnd.toISOString(), 'Studio B', 25]);

    // Evening class
    const evening = new Date(date);
    evening.setHours(18, 0, 0, 0);
    const eveningEnd = new Date(evening);
    eveningEnd.setMinutes(eveningEnd.getMinutes() + 45);
    schedules.push([2, 3, evening.toISOString(), eveningEnd.toISOString(), 'Studio A', 15]);
  }

  const insertSchedule = db.prepare(`
    INSERT INTO class_schedule (class_id, instructor_id, start_time, end_time, location, spots_available)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  schedules.forEach(sch => insertSchedule.run(...sch));

  // Insert some orders
  const orders = [
    [4, 64.98, 'delivered', '123 Main St, City, 12345', 'credit_card', 'completed'],
    [5, 89.99, 'shipped', '456 Oak Ave, Town, 67890', 'credit_card', 'completed'],
    [6, 39.99, 'processing', '789 Pine Rd, Village, 11111', 'paypal', 'completed']
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  orders.forEach(order => insertOrder.run(...order));

  // Insert order items
  const orderItems = [
    [1, 1, 1, 39.99],
    [1, 3, 1, 24.99],
    [2, 4, 1, 89.99],
    [3, 1, 1, 39.99]
  ];

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (?, ?, ?, ?)
  `);
  orderItems.forEach(item => insertOrderItem.run(...item));

  // Insert subscriptions
  const subscriptions = [
    [4, 2, '2024-01-01', '2024-02-01', 'active', 'credit_card'],
    [5, 3, '2024-01-15', '2024-02-15', 'active', 'credit_card'],
    [6, 1, '2024-01-10', '2024-02-10', 'active', 'paypal']
  ];

  const insertSubscription = db.prepare(`
    INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  subscriptions.forEach(sub => insertSubscription.run(...sub));

  console.log('Seed data inserted successfully!');
};

seedData();
db.close();

console.log('Database initialization complete!');
console.log('Default credentials:');
console.log('  Admin: admin@fitnesshub.com / admin123');
console.log('  Trainer: trainer@fitnesshub.com / trainer123');
console.log('  Member: member@fitnesshub.com / member123');
