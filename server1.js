const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();


app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/studentDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Models
const Admin = mongoose.model("Admin", {
  email: String,
  password: String,
  key: String,
}, "admin");

const Teacher = mongoose.model("Teacher", {
  email: { type: String, unique: true },
  password: String,
  name: String,
});

const Student = mongoose.model("Student", {
  email: { type: String, unique: true },
  password: String,
  name: String,
});


app.post("/admin/create-default", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const newAdmin = new Admin({
      email: "admin@12.com",
      password: hashedPassword,
      key: "secretkey",
    });

    await newAdmin.save();
    res.json({ success: true, message: "Default admin created!" });
  } catch (err) {
    console.error("❌ Admin creation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Admin Login Route
app.post("/admin/login", async (req, res) => {
  const { email, password, key } = req.body;

  console.log("🔐 Login Attempt:", { email, key });

  try {
    const admin = await Admin.findOne({ email, key });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        return res.json({ success: true, message: "Login successful" });
      }
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add Teacher or Student Route
app.post("/admin/add-user", async (req, res) => {
  const { email, password, role, name } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const existing = role === "Teacher"
      ? await Teacher.findOne({ email })
      : await Student.findOne({ email });

    if (existing) {
      return res.status(409).json({ success: false, message: ${role} with this email already exists. });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "Teacher") {
      const teacher = new Teacher({ email, password: hashedPassword, name });
      await teacher.save();
    } else if (role === "Student") {
      const student = new Student({ email, password: hashedPassword, name });
      await student.save();
    } else {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    res.json({ success: true, message: ${role} added successfully! });
  } catch (err) {
    console.error("❌ Error adding user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add Teacher (separate route if needed)
app.post("/admin/add-teacher", async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const teacher = new Teacher({ email, password: hashedPassword, name });
  await teacher.save();
  res.json({ success: true });
});

// Add Student (separate route if needed)
app.post("/admin/add-student", async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const student = new Student({ email, password: hashedPassword, name });
  await student.save();
  res.json({ success: true });
});

// Get all Teachers
app.get("/admin/teachers", async (req, res) => {
  const teachers = await Teacher.find();
  res.json(teachers);
});

// Get all Students
app.get("/admin/students", async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// Get all Users (both Teachers and Students)
app.get("/admin/users", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    const students = await Student.find();
    res.json({ teachers, students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});


app.post("/student/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (isMatch) {
      res.json({ success: true, message: "Login successful", student });
    } else {
      res.status(401).json({ success: false, message: "Incorrect password" });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/teacher/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (isMatch) {
      res.json({ success: true, message: "Login successful", teacher });
    } else {
      res.status(401).json({ success: false, message: "Incorrect password" });
    }
  } catch (err) {
    console.error("❌ Teacher Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start server
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});