const express = require("express");
const router = express.Router();
const { createChild, getChildren, getChild, updateChild, deleteChild } = require("../controllers/childController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Protect all routes
router.use(protect);

router.route("/")
  .get(getChildren)
  .post(authorize("orphanage", "admin"), createChild);

router.route("/:id")
  .get(getChild)
  .put(authorize("orphanage", "admin"), updateChild)
  .delete(authorize("orphanage", "admin"), deleteChild);

module.exports = router;