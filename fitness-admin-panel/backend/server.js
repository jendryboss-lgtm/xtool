const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fitness-admin-secret-key-2024';

// Database connection
const db = new Database(path.join(__dirname, 'database', 'fitness.db'));
db.pragma('foreign_keys = ON');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireTrainer = (req, res, next) => {
  if (!['admin', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Trainer access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, first_name, last_name, role, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ==================== DASHBOARD / ANALYTICS ====================

app.get('/api/dashboard/stats', authenticate, requireTrainer, (req, res) => {
  const stats = {
    totalUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "member"').get().count,
    activeMembers: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "member" AND membership_status = "active"').get().count,
    totalClasses: db.prepare('SELECT COUNT(*) as count FROM fitness_classes WHERE is_active = 1').get().count,
    totalPrograms: db.prepare('SELECT COUNT(*) as count FROM workout_programs WHERE is_published = 1').get().count,
    totalOrders: db.prepare('SELECT COUNT(*) as count FROM orders').get().count,
    totalRevenue: db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "completed"').get().total,
    upcomingClasses: db.prepare('SELECT COUNT(*) as count FROM class_schedule WHERE start_time > datetime("now") AND status = "scheduled"').get().count,
    newMembersThisMonth: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "member" AND created_at >= date("now", "start of month")').get().count
  };
  res.json(stats);
});

app.get('/api/dashboard/recent-activity', authenticate, requireTrainer, (req, res) => {
  const recentUsers = db.prepare(`
    SELECT id, first_name, last_name, email, created_at
    FROM users WHERE role = 'member'
    ORDER BY created_at DESC LIMIT 5
  `).all();

  const recentOrders = db.prepare(`
    SELECT o.id, o.total_amount, o.status, o.created_at, u.first_name, u.last_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const upcomingClasses = db.prepare(`
    SELECT cs.id, cs.start_time, cs.location, fc.name as class_name, u.first_name as instructor_name
    FROM class_schedule cs
    JOIN fitness_classes fc ON cs.class_id = fc.id
    JOIN users u ON cs.instructor_id = u.id
    WHERE cs.start_time > datetime('now')
    ORDER BY cs.start_time LIMIT 5
  `).all();

  res.json({ recentUsers, recentOrders, upcomingClasses });
});

app.get('/api/dashboard/charts', authenticate, requireTrainer, (req, res) => {
  // Revenue by month (last 6 months)
  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount) as revenue
    FROM orders WHERE payment_status = 'completed'
    GROUP BY month ORDER BY month DESC LIMIT 6
  `).all().reverse();

  // Members by plan
  const membersByPlan = db.prepare(`
    SELECT mp.name, COUNT(u.id) as count
    FROM membership_plans mp
    LEFT JOIN users u ON u.membership_plan_id = mp.id
    GROUP BY mp.id
  `).all();

  // Class popularity
  const classPopularity = db.prepare(`
    SELECT fc.name, COUNT(cb.id) as bookings
    FROM fitness_classes fc
    LEFT JOIN class_schedule cs ON cs.class_id = fc.id
    LEFT JOIN class_bookings cb ON cb.schedule_id = cs.id
    GROUP BY fc.id ORDER BY bookings DESC LIMIT 5
  `).all();

  res.json({ revenueByMonth, membersByPlan, classPopularity });
});

// ==================== USER MANAGEMENT ====================

app.get('/api/users', authenticate, requireTrainer, (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  let query = 'SELECT id, email, first_name, last_name, role, phone, membership_status, membership_plan_id, join_date, last_login FROM users WHERE 1=1';
  const params = [];

  if (role) { query += ' AND role = ?'; params.push(role); }
  if (status) { query += ' AND membership_status = ?'; params.push(status); }
  if (search) { query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const offset = (page - 1) * limit;
  query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

app.get('/api/users/:id', authenticate, requireTrainer, (req, res) => {
  const user = db.prepare(`
    SELECT u.*, mp.name as plan_name
    FROM users u
    LEFT JOIN membership_plans mp ON u.membership_plan_id = mp.id
    WHERE u.id = ?
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  delete user.password;
  res.json(user);
});

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { email, password, firstName, lastName, role, phone, membershipPlanId } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (email, password, first_name, last_name, role, phone, membership_plan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(email, hashedPassword, firstName, lastName, role || 'member', phone, membershipPlanId);

    res.status(201).json({ id: result.lastInsertRowid, message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const { firstName, lastName, phone, role, membershipStatus, membershipPlanId, fitnessGoals } = req.body;

  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, role = ?,
    membership_status = ?, membership_plan_id = ?, fitness_goals = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(firstName, lastName, phone, role, membershipStatus, membershipPlanId, fitnessGoals, req.params.id);

  res.json({ message: 'User updated successfully' });
});

app.delete('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted successfully' });
});

// ==================== MEMBERSHIP PLANS ====================

app.get('/api/plans', authenticate, (req, res) => {
  const plans = db.prepare('SELECT * FROM membership_plans ORDER BY price').all();
  res.json(plans);
});

app.post('/api/plans', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, durationMonths, features } = req.body;
  const result = db.prepare(`
    INSERT INTO membership_plans (name, description, price, duration_months, features)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description, price, durationMonths, features);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/plans/:id', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, durationMonths, features, isActive } = req.body;
  db.prepare(`
    UPDATE membership_plans SET name = ?, description = ?, price = ?,
    duration_months = ?, features = ?, is_active = ? WHERE id = ?
  `).run(name, description, price, durationMonths, features, isActive ? 1 : 0, req.params.id);

  res.json({ message: 'Plan updated successfully' });
});

app.delete('/api/plans/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM membership_plans WHERE id = ?').run(req.params.id);
  res.json({ message: 'Plan deleted successfully' });
});

// ==================== WORKOUT PROGRAMS ====================

app.get('/api/programs', authenticate, (req, res) => {
  const programs = db.prepare(`
    SELECT wp.*, u.first_name || ' ' || u.last_name as trainer_name
    FROM workout_programs wp
    LEFT JOIN users u ON wp.trainer_id = u.id
    ORDER BY wp.created_at DESC
  `).all();
  res.json(programs);
});

app.get('/api/programs/:id', authenticate, (req, res) => {
  const program = db.prepare(`
    SELECT wp.*, u.first_name || ' ' || u.last_name as trainer_name
    FROM workout_programs wp
    LEFT JOIN users u ON wp.trainer_id = u.id
    WHERE wp.id = ?
  `).get(req.params.id);

  if (!program) return res.status(404).json({ error: 'Program not found' });

  const exercises = db.prepare(`
    SELECT pe.*, e.name, e.description, e.muscle_group, e.equipment
    FROM program_exercises pe
    JOIN exercises e ON pe.exercise_id = e.id
    WHERE pe.program_id = ?
    ORDER BY pe.day_number, pe.order_index
  `).all(req.params.id);

  res.json({ ...program, exercises });
});

app.post('/api/programs', authenticate, requireTrainer, (req, res) => {
  const { title, description, difficulty, durationWeeks, category, trainerId, isPublished } = req.body;
  const result = db.prepare(`
    INSERT INTO workout_programs (title, description, difficulty, duration_weeks, category, trainer_id, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, difficulty, durationWeeks, category, trainerId || req.user.id, isPublished ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/programs/:id', authenticate, requireTrainer, (req, res) => {
  const { title, description, difficulty, durationWeeks, category, trainerId, isPublished } = req.body;
  db.prepare(`
    UPDATE workout_programs SET title = ?, description = ?, difficulty = ?,
    duration_weeks = ?, category = ?, trainer_id = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, difficulty, durationWeeks, category, trainerId, isPublished ? 1 : 0, req.params.id);

  res.json({ message: 'Program updated successfully' });
});

app.delete('/api/programs/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM workout_programs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Program deleted successfully' });
});

// ==================== EXERCISES ====================

app.get('/api/exercises', authenticate, (req, res) => {
  const exercises = db.prepare('SELECT * FROM exercises ORDER BY name').all();
  res.json(exercises);
});

app.post('/api/exercises', authenticate, requireTrainer, (req, res) => {
  const { name, description, muscleGroup, equipment, videoUrl, imageUrl, instructions } = req.body;
  const result = db.prepare(`
    INSERT INTO exercises (name, description, muscle_group, equipment, video_url, image_url, instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, muscleGroup, equipment, videoUrl, imageUrl, instructions);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/exercises/:id', authenticate, requireTrainer, (req, res) => {
  const { name, description, muscleGroup, equipment, videoUrl, imageUrl, instructions } = req.body;
  db.prepare(`
    UPDATE exercises SET name = ?, description = ?, muscle_group = ?,
    equipment = ?, video_url = ?, image_url = ?, instructions = ?
    WHERE id = ?
  `).run(name, description, muscleGroup, equipment, videoUrl, imageUrl, instructions, req.params.id);

  res.json({ message: 'Exercise updated successfully' });
});

app.delete('/api/exercises/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
  res.json({ message: 'Exercise deleted successfully' });
});

// ==================== FITNESS CLASSES ====================

app.get('/api/classes', authenticate, (req, res) => {
  const classes = db.prepare(`
    SELECT fc.*, u.first_name || ' ' || u.last_name as instructor_name
    FROM fitness_classes fc
    LEFT JOIN users u ON fc.instructor_id = u.id
    ORDER BY fc.name
  `).all();
  res.json(classes);
});

app.post('/api/classes', authenticate, requireAdmin, (req, res) => {
  const { name, description, classType, instructorId, maxCapacity, durationMinutes } = req.body;
  const result = db.prepare(`
    INSERT INTO fitness_classes (name, description, class_type, instructor_id, max_capacity, duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, classType, instructorId, maxCapacity, durationMinutes);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/classes/:id', authenticate, requireAdmin, (req, res) => {
  const { name, description, classType, instructorId, maxCapacity, durationMinutes, isActive } = req.body;
  db.prepare(`
    UPDATE fitness_classes SET name = ?, description = ?, class_type = ?,
    instructor_id = ?, max_capacity = ?, duration_minutes = ?, is_active = ?
    WHERE id = ?
  `).run(name, description, classType, instructorId, maxCapacity, durationMinutes, isActive ? 1 : 0, req.params.id);

  res.json({ message: 'Class updated successfully' });
});

app.delete('/api/classes/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM fitness_classes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Class deleted successfully' });
});

// ==================== CLASS SCHEDULE ====================

app.get('/api/schedule', authenticate, (req, res) => {
  const { start, end } = req.query;
  let query = `
    SELECT cs.*, fc.name as class_name, fc.class_type, fc.duration_minutes,
    u.first_name || ' ' || u.last_name as instructor_name
    FROM class_schedule cs
    JOIN fitness_classes fc ON cs.class_id = fc.id
    LEFT JOIN users u ON cs.instructor_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (start) { query += ' AND cs.start_time >= ?'; params.push(start); }
  if (end) { query += ' AND cs.start_time <= ?'; params.push(end); }

  query += ' ORDER BY cs.start_time';
  const schedule = db.prepare(query).all(...params);
  res.json(schedule);
});

app.post('/api/schedule', authenticate, requireTrainer, (req, res) => {
  const { classId, instructorId, startTime, endTime, location, spotsAvailable } = req.body;
  const result = db.prepare(`
    INSERT INTO class_schedule (class_id, instructor_id, start_time, end_time, location, spots_available)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(classId, instructorId, startTime, endTime, location, spotsAvailable);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/schedule/:id', authenticate, requireTrainer, (req, res) => {
  const { classId, instructorId, startTime, endTime, location, spotsAvailable, status } = req.body;
  db.prepare(`
    UPDATE class_schedule SET class_id = ?, instructor_id = ?, start_time = ?,
    end_time = ?, location = ?, spots_available = ?, status = ?
    WHERE id = ?
  `).run(classId, instructorId, startTime, endTime, location, spotsAvailable, status, req.params.id);

  res.json({ message: 'Schedule updated successfully' });
});

app.delete('/api/schedule/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM class_schedule WHERE id = ?').run(req.params.id);
  res.json({ message: 'Schedule deleted successfully' });
});

// ==================== ARTICLES / BLOG ====================

app.get('/api/articles', authenticate, (req, res) => {
  const articles = db.prepare(`
    SELECT a.*, u.first_name || ' ' || u.last_name as author_name
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(articles);
});

app.get('/api/articles/:id', authenticate, (req, res) => {
  const article = db.prepare(`
    SELECT a.*, u.first_name || ' ' || u.last_name as author_name
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

app.post('/api/articles', authenticate, requireTrainer, (req, res) => {
  const { title, slug, content, excerpt, category, imageUrl, isPublished } = req.body;
  const result = db.prepare(`
    INSERT INTO articles (title, slug, content, excerpt, author_id, category, image_url, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, slug, content, excerpt, req.user.id, category, imageUrl, isPublished ? 1 : 0, isPublished ? new Date().toISOString() : null);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/articles/:id', authenticate, requireTrainer, (req, res) => {
  const { title, slug, content, excerpt, category, imageUrl, isPublished } = req.body;
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);

  db.prepare(`
    UPDATE articles SET title = ?, slug = ?, content = ?, excerpt = ?,
    category = ?, image_url = ?, is_published = ?,
    published_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, slug, content, excerpt, category, imageUrl, isPublished ? 1 : 0,
    (isPublished && !article.published_at) ? new Date().toISOString() : article.published_at, req.params.id);

  res.json({ message: 'Article updated successfully' });
});

app.delete('/api/articles/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Article deleted successfully' });
});

// ==================== NUTRITION PLANS ====================

app.get('/api/nutrition', authenticate, (req, res) => {
  const plans = db.prepare(`
    SELECT np.*, u.first_name || ' ' || u.last_name as creator_name
    FROM nutrition_plans np
    LEFT JOIN users u ON np.created_by = u.id
    ORDER BY np.created_at DESC
  `).all();
  res.json(plans);
});

app.get('/api/nutrition/:id', authenticate, (req, res) => {
  const plan = db.prepare(`
    SELECT np.*, u.first_name || ' ' || u.last_name as creator_name
    FROM nutrition_plans np
    LEFT JOIN users u ON np.created_by = u.id
    WHERE np.id = ?
  `).get(req.params.id);

  if (!plan) return res.status(404).json({ error: 'Nutrition plan not found' });

  const meals = db.prepare('SELECT * FROM meals WHERE nutrition_plan_id = ?').all(req.params.id);
  res.json({ ...plan, meals });
});

app.post('/api/nutrition', authenticate, requireTrainer, (req, res) => {
  const { title, description, caloriesTarget, proteinTarget, carbsTarget, fatTarget, mealCount, dietType, isPublished } = req.body;
  const result = db.prepare(`
    INSERT INTO nutrition_plans (title, description, calories_target, protein_target, carbs_target, fat_target, meal_count, diet_type, created_by, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, caloriesTarget, proteinTarget, carbsTarget, fatTarget, mealCount, dietType, req.user.id, isPublished ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/nutrition/:id', authenticate, requireTrainer, (req, res) => {
  const { title, description, caloriesTarget, proteinTarget, carbsTarget, fatTarget, mealCount, dietType, isPublished } = req.body;
  db.prepare(`
    UPDATE nutrition_plans SET title = ?, description = ?, calories_target = ?,
    protein_target = ?, carbs_target = ?, fat_target = ?, meal_count = ?, diet_type = ?, is_published = ?
    WHERE id = ?
  `).run(title, description, caloriesTarget, proteinTarget, carbsTarget, fatTarget, mealCount, dietType, isPublished ? 1 : 0, req.params.id);

  res.json({ message: 'Nutrition plan updated successfully' });
});

app.delete('/api/nutrition/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM nutrition_plans WHERE id = ?').run(req.params.id);
  res.json({ message: 'Nutrition plan deleted successfully' });
});

// ==================== PRODUCTS ====================

app.get('/api/products', authenticate, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

app.post('/api/products', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, salePrice, stockQuantity, category, imageUrl } = req.body;
  const result = db.prepare(`
    INSERT INTO products (name, description, price, sale_price, stock_quantity, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, price, salePrice, stockQuantity, category, imageUrl);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/products/:id', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, salePrice, stockQuantity, category, imageUrl, isActive } = req.body;
  db.prepare(`
    UPDATE products SET name = ?, description = ?, price = ?, sale_price = ?,
    stock_quantity = ?, category = ?, image_url = ?, is_active = ?
    WHERE id = ?
  `).run(name, description, price, salePrice, stockQuantity, category, imageUrl, isActive ? 1 : 0, req.params.id);

  res.json({ message: 'Product updated successfully' });
});

app.delete('/api/products/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted successfully' });
});

// ==================== ORDERS ====================

app.get('/api/orders', authenticate, requireTrainer, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let query = `
    SELECT o.*, u.first_name, u.last_name, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND o.status = ?'; params.push(status); }

  const offset = (page - 1) * limit;
  query += ` ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  res.json({ orders, total });
});

app.get('/api/orders/:id', authenticate, requireTrainer, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.first_name, u.last_name, u.email, u.phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

app.put('/api/orders/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Order status updated successfully' });
});

// ==================== SUBSCRIPTIONS ====================

app.get('/api/subscriptions', authenticate, requireAdmin, (req, res) => {
  const subscriptions = db.prepare(`
    SELECT s.*, u.first_name, u.last_name, u.email, mp.name as plan_name, mp.price
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    JOIN membership_plans mp ON s.plan_id = mp.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(subscriptions);
});

app.put('/api/subscriptions/:id', authenticate, requireAdmin, (req, res) => {
  const { status, endDate, autoRenew } = req.body;
  db.prepare(`
    UPDATE subscriptions SET status = ?, end_date = ?, auto_renew = ?
    WHERE id = ?
  `).run(status, endDate, autoRenew ? 1 : 0, req.params.id);

  res.json({ message: 'Subscription updated successfully' });
});

// ==================== FILE UPLOAD ====================

app.post('/api/upload', authenticate, requireTrainer, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// ==================== TRAINERS ====================

app.get('/api/trainers', authenticate, (req, res) => {
  const trainers = db.prepare(`
    SELECT id, first_name, last_name, email, phone, avatar
    FROM users WHERE role IN ('trainer', 'admin')
    ORDER BY first_name
  `).all();
  res.json(trainers);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
