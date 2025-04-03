const Team = require("../models/Team");
const User = require("../models/User");

exports.createTeam = async (req, res) => {
  try {
    const { students, teachers } = req.body;

    // Get the logged-in user (team creator)
    const creator = await User.findById(req.user.id);

    if (!creator) {
      return res.status(404).json({ error: "User not found" });
    }

    // Auto-fill team name with creator's school
    const teamName = creator.school;

    // Ensure the creator is not adding themselves again
    const allMembers = [...students, ...teachers];
    if (allMembers.includes(req.user.id)) {
      return res.status(400).json({ error: "You cannot add yourself to the team." });
    }

    // Validate student and teacher IDs exist
    const studentUsers = await User.find({ _id: { $in: students }, role: "student" });
    const teacherUsers = await User.find({ _id: { $in: teachers }, role: "teacher" });

    if (studentUsers.length !== students.length || teacherUsers.length !== teachers.length) {
      return res.status(400).json({ error: "Invalid student or teacher IDs" });
    }

    // Create new team
    const team = new Team({
      teamName,
      createdBy: req.user.id, // Track the creator
      students,
      teachers
    });

    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only admins can view teams." });
    }

    const teams = await Team.find()
      .populate("students", "name email")
      .populate("teachers", "name email");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getTeamById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only admins can view a team." });
    }

    const team = await Team.findById(req.params.id)
      .populate("students", "name email")
      .populate("teachers", "name email");

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only admins can update teams." });
    }

    const { students, teachers } = req.body;

    // Validate student and teacher IDs exist
    const studentUsers = await User.find({ _id: { $in: students }, role: "student" });
    const teacherUsers = await User.find({ _id: { $in: teachers }, role: "teacher" });

    if (studentUsers.length !== students.length || teacherUsers.length !== teachers.length) {
      return res.status(400).json({ error: "Invalid student or teacher IDs" });
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      { students, teachers },
      { new: true }
    )
      .populate("students", "name email")
      .populate("teachers", "name email");

    if (!updatedTeam) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ message: "Team updated successfully", updatedTeam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.deleteTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Only admins can delete teams." });
    }

    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeam) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};