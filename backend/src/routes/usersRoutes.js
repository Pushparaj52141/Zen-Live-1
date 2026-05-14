const express = require("express");
const multer = require("multer");
const upload = multer();
const { authenticateToken } = require("../middlewares/authMiddleware");

const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserImage,
  getAllRoles,
  assignUserRoles,
} = require("../controllers/users/userController");

const router = express.Router();

router.post("/users",authenticateToken, upload.single("profile_image"), createUser);
router.get("/users",authenticateToken, getAllUsers);
router.put("/users/:id", authenticateToken, upload.any(), updateUser);
router.delete("/users/:id", authenticateToken,deleteUser);
router.get("/users/image/:id",authenticateToken, getUserImage);
router.get("/user_roles",authenticateToken,getAllRoles)
router.patch("/users/:id/roles", authenticateToken, assignUserRoles);

module.exports = router;
