// controllers/categoryController.js
// Manages food categories (e.g. Beverages, Rice & Noodles).

const { pool } = require('../config/db');

// Public: list all active categories (used to populate menu filters)
exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE status = 'active' ORDER BY name ASC"
    );
    return res.json({ success: true, categories: rows });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Admin: create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    return res.status(201).json({ success: true, message: 'Category created.', categoryId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Admin: update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
      [name, description, status || 'active', id]
    );

    return res.json({ success: true, message: 'Category updated.' });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Admin: delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting a category that still has foods attached
    const [foods] = await pool.query('SELECT id FROM foods WHERE category_id = ? LIMIT 1', [id]);
    if (foods.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a category that still has food items. Move or delete those items first.'
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
