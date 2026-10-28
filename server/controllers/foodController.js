// controllers/foodController.js
// Manages food/menu items: list, search, get one, create, update, delete.

const { pool } = require('../config/db');

// -----------------------------------------------------------
// PUBLIC: Get all available foods (optionally filtered by category)
// GET /api/foods?category=2
// -----------------------------------------------------------
exports.getAllFoods = async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT f.*, c.name AS category_name
      FROM foods f
      JOIN categories c ON c.id = f.category_id
      WHERE f.is_available = 1
    `;
    const params = [];

    if (category) {
      query += ' AND f.category_id = ?';
      params.push(category);
    }

    query += ' ORDER BY f.is_featured DESC, f.name ASC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, foods: rows });
  } catch (error) {
    console.error('Get foods error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// PUBLIC: Search foods by name
// GET /api/foods/search?q=milk
// -----------------------------------------------------------
exports.searchFoods = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query "q" is required.' });
    }

    const [rows] = await pool.query(
      `SELECT f.*, c.name AS category_name
       FROM foods f
       JOIN categories c ON c.id = f.category_id
       WHERE f.is_available = 1 AND f.name LIKE ?
       ORDER BY f.name ASC`,
      [`%${q}%`]
    );

    return res.json({ success: true, foods: rows });
  } catch (error) {
    console.error('Search foods error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// PUBLIC: Get single food by ID
// -----------------------------------------------------------
exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT f.*, c.name AS category_name
       FROM foods f JOIN categories c ON c.id = f.category_id
       WHERE f.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }
    return res.json({ success: true, food: rows[0] });
  } catch (error) {
    console.error('Get food by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: Create food (with optional image upload via Multer)
// -----------------------------------------------------------
exports.createFood = async (req, res) => {
  try {
    const { category_id, name, description, price, is_featured } = req.body;

    if (!category_id || !name || !price) {
      return res.status(400).json({ success: false, message: 'category_id, name and price are required.' });
    }

    // req.file is populated by the "upload" (Multer) middleware, if an image was sent
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO foods (category_id, name, description, price, image, is_featured)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, name, description || null, price, image, is_featured ? 1 : 0]
    );

    return res.status(201).json({ success: true, message: 'Food item created.', foodId: result.insertId });
  } catch (error) {
    console.error('Create food error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: Update food
// -----------------------------------------------------------
exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, is_available, is_featured } = req.body;

    // If a new image was uploaded, use it; otherwise keep the existing one.
    let imageClause = '';
    const params = [category_id, name, description, price, is_available ? 1 : 0, is_featured ? 1 : 0];

    if (req.file) {
      imageClause = ', image = ?';
      params.push(`/uploads/${req.file.filename}`);
    }

    params.push(id);

    await pool.query(
      `UPDATE foods
       SET category_id = ?, name = ?, description = ?, price = ?, is_available = ?, is_featured = ? ${imageClause}
       WHERE id = ?`,
      params
    );

    return res.json({ success: true, message: 'Food item updated.' });
  } catch (error) {
    console.error('Update food error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: Delete food
// -----------------------------------------------------------
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM foods WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Food item deleted.' });
  } catch (error) {
    // If the food is referenced by past order_items (FK RESTRICT), deletion will fail.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this item because it appears in past orders. Mark it unavailable instead.'
      });
    }
    console.error('Delete food error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// -----------------------------------------------------------
// ADMIN: Get ALL foods including unavailable ones (for admin menu management page)
// -----------------------------------------------------------
exports.getAllFoodsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, c.name AS category_name
       FROM foods f JOIN categories c ON c.id = f.category_id
       ORDER BY f.created_at DESC`
    );
    return res.json({ success: true, foods: rows });
  } catch (error) {
    console.error('Get all foods (admin) error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
