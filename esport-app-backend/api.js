const db = require("./db");
const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const fetch = require("node-fetch");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const publicRoutes = [
  "/games",
  "/login",
  "/user/register",
  "/cities",
  "/game_genres",
  "/game_modes",
  "/game_platforms",
  "/community_types",
  "/skill_levels",
  "/languages",
  "/api/nearbyPlaces",
];

// const http = require("http");
// const socketIo = require("socket.io");
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

const skillLevels = ["Beginner", "Intermediate", "Expert", "Pro", "Amateur"];
const languages = ["English", "French", "Spanish", "German", "Chinese"];

const JWT_SECRET = "kdhdjbzajhdbaezhjb7867786877";
app.use(cors());

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  console.log("authHeader", authHeader);
  if (!token) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "JWT invalide" });
    }

    req.userId = decoded.user_id;
    console.log("The token is valid and the userId is : ", req.userId);
    next();
  });
};

// app.use((req, res, next) => {
//   if (req.path.startsWith("/socket.io") || publicRoutes.includes(req.path)) {
//     return next();
//   }
//   authenticateJWT(req, res, next);
// });

// app.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.path}`);
//   console.log("Headers:", req.headers);
//   next();
// });

// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   console.log("Received JWT Token in Socket.IO:", token); // Pour le débogage
//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       console.error("Échec de l'authentification Socket.io:", err);
//       return next(new Error("Authentification échouée"));
//     }
//     socket.userId = decoded.userId;
//     next();
//   });
// });

// io.use((socket, next) => {
//   console.log("Socket connected without auth check");
//   next();
// });

app.use((req, res, next) => {
  if (!publicRoutes.includes(req.path)) {
    authenticateJWT(req, res, next);
  } else {
    next();
  }
});

app.use(express.json());

app.get("/groups", async (req, res) => {
  const userId = req.userId;
  let client;

  try {
    client = await db.connect();

    const result = await client.query(
      `
    SELECT g.group_id, g.group_name, g.group_description, g.group_picture, 
           g.creation_date, c.city_name,
           gm.role as user_role, gm.membership_status,
           array_agg(distinct ugp.language) as languages
    FROM groups g 
    JOIN cities c ON g.city_id = c.city_id
    LEFT JOIN group_memberships gm ON g.group_id = gm.group_id AND gm.user_id = $1
    LEFT JOIN user_group_preferences ugp ON g.preference_id = ugp.preference_id
    GROUP BY g.group_id, c.city_name, gm.role, gm.membership_status
  `,
      [userId]
    );

    const groups = result.rows.map((group) => ({
      ...group,
      is_admin: group.user_role === "admin",
      is_member:
        group.membership_status === "accepted" && group.user_role !== "admin",
      requestSent: group.membership_status === "pending",
      languages: group.languages,
      genres: group.game_genres,
    }));

    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      const validPassword = await bcrypt.compare(
        password,
        user.rows[0].password
      );

      if (validPassword) {
        const token = jwt.sign(
          {
            user_id: user.rows[0].user_id,
            role: user.rows[0].role,
          },
          JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res.json({
          token,
          user: {
            id: user.rows[0].user_id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            picture: user.rows[0].profile_picture,
          },
          message: "User logged in successfully",
        });
        console.log(user.rows[0].name);
      } else {
        res.status(400).json({ message: "Invalid Password" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    // Error handling
    console.error(error.message);
    res.status(500).send("Server error");
  }
});
app.get("/game_modes", async (req, res) => {
  try {
    const gameModes = await db.query("SELECT * FROM game_modes");
    res.json(gameModes.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/game_genres", async (req, res) => {
  try {
    const gameGenres = await db.query("SELECT * FROM game_genres");
    res.json(gameGenres.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/game_platforms", async (req, res) => {
  try {
    const gamePlatforms = await db.query("SELECT * FROM game_platforms");
    res.json(gamePlatforms.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/community_types", async (req, res) => {
  try {
    const communityTypes = await db.query("SELECT * FROM community_types");
    res.json(communityTypes.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/skill_levels", (req, res) => {
  res.json(skillLevels);
});

app.get("/languages", (req, res) => {
  res.json(languages);
});

app.get("/api/nearbyPlaces", async (req, res) => {
  // Extract user location from query parameters
  const { lat, lng } = req.query;
  console.log("lat", lat);
  console.log("lng", lng);

  // Use your Google Places API Key here
  const apiKey = process.env.GOOGLE_API_KEY; // Store API key securely
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=restaurant&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.results);
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/user/register", async (req, res) => {
  const {
    first_name,
    last_name,
    gender,
    username,
    email,
    password,
    city_id,
    profile_picture,
    preferences,
  } = req.body;

  let client;

  try {
    client = await db.connect();
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const existingUser = await client.query(
      "SELECT * FROM users WHERE nickname = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Username or Email already exists" });
    }

    // Insert into user_group_preferences
    const prefResult = await client.query(
      "INSERT INTO user_group_preferences (language, skill_level, game_genres, game_modes, game_platforms, community_types) VALUES ($1, $2, $3, $4, $5, $6) RETURNING preference_id",
      [
        preferences.languages,
        preferences.skillLevels,
        preferences.gameGenres,
        preferences.gameModes,
        preferences.gamePlatforms,
        preferences.communityTypes,
      ]
    );
    const preferenceId = prefResult.rows[0].preference_id;

    // Insert into users
    const userResult = await client.query(
      "INSERT INTO users (name, surname, gender, nickname, email, password, city_id, profile_picture, is_available, preference_id,role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11) RETURNING user_id",
      [
        last_name,
        first_name,
        gender,
        username,
        email,
        hashedPassword,
        city_id,
        profile_picture,
        true,
        preferenceId,
        "user",
      ]
    );

    res.status(201).json({
      message: "User created successfully",
      userId: userResult.rows[0].user_id,
    });
  } catch (err) {
    console.error("Error during user creation:", err);
    res
      .status(500)
      .json({ error: "Internal server error", detail: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.put("/user/profile", authenticateJWT, async (req, res) => {
  const userId = req.userId;
  const {
    first_name,
    last_name,
    email,
    cityId,
    profile_picture,
    preferences,
    username,
  } = req.body;

  let client;
  try {
    client = await db.connect();

    // Update user's information in the database
    await client.query(
      `UPDATE users 
       SET name = $1, surname = $2, email = $3,city_id = $4, profile_picture = $5, nickname = $6
       WHERE user_id = $7`,
      [last_name, first_name, email, cityId, profile_picture, username, userId]
    );

    // Update user preferences
    await client.query(
      `UPDATE user_group_preferences 
       SET game_genres = $1, game_modes = $2, skill_level = $3, game_platforms = $4, community_types = $5, language = $6
       WHERE preference_id = (SELECT preference_id FROM users WHERE user_id = $7)`,
      [
        preferences.gameGenres,
        preferences.gameModes,
        preferences.skillLevel,
        preferences.gamePlatforms,
        preferences.communityTypes,
        preferences.languages,
        userId,
      ]
    );

    client.release();
    res.json({ message: "Profile and preferences updated successfully" });
  } catch (err) {
    console.error(err);
    client?.release();
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user/profile", authenticateJWT, async (req, res) => {
  const userId = req.userId;

  let client;
  try {
    client = await db.connect();

    // Query to get user's basic information
    const userInfo = await client.query(
      `SELECT name, surname, email, city_id, profile_picture,nickname
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    // Query to get user's preferences
    const userPreferences = await client.query(
      `SELECT game_genres, game_modes, skill_level, game_platforms, community_types, language
       FROM user_group_preferences
       WHERE preference_id = (SELECT preference_id FROM users WHERE user_id = $1)`,
      [userId]
    );

    client.release();

    if (userInfo.rows.length > 0 && userPreferences.rows.length > 0) {
      res.json({
        profile: userInfo.rows[0],
        preferences: userPreferences.rows[0],
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    client?.release();
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/location
app.get("/user/location", async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  let client;
  try {
    client = await db.connect();

    const result = await client.query(
      `SELECT c.latitude, c.longitude, u.profile_picture
       FROM users u
       JOIN cities c ON u.city_id = c.city_id
       WHERE u.user_id = $1`,
      [userId]
    );

    client.release();
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User location not found" });
    }
  } catch (err) {
    console.error(err);
    client?.release();
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /groups/locations
app.get("/groups/locations", async (req, res) => {
  let client;
  try {
    client = await db.connect();
    const result = await client.query(
      `SELECT g.group_id, g.group_name, c.latitude, c.longitude, g.group_picture
       FROM groups g
       JOIN cities c ON g.city_id = c.city_id`
    );

    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    client?.release();
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/cities", async (req, res) => {
  let client;
  try {
    const client = await db.connect();
    const result = await client.query("SELECT * FROM cities");
    res.json(result.rows);
  } catch (err) {
    console.error("Error connecting to the database:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});
app.post("/groups/create", authenticateJWT, async (req, res) => {
  const {
    groupName,
    groupPreferences,
    cityId,
    groupPicture,
    groupDescription,
  } = req.body;
  const userId = req.userId;

  let client;
  try {
    client = await db.connect();

    // Insert into user_group_preferences
    const prefResult = await client.query(
      "INSERT INTO user_group_preferences (language, skill_level, game_genres, game_modes, game_platforms, community_types) VALUES ($1, $2, $3, $4, $5, $6) RETURNING preference_id",
      [
        groupPreferences.languages,
        groupPreferences.skillLevels,
        groupPreferences.gameGenres,
        groupPreferences.gameModes,
        groupPreferences.gamePlatforms,
        groupPreferences.communityTypes,
      ]
    );
    const preferenceId = prefResult.rows[0].preference_id;

    // Insert into groups
    const groupResult = await client.query(
      "INSERT INTO groups (group_name, group_picture, group_description, creation_date, city_id, preference_id) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING group_id",
      [groupName, groupPicture, groupDescription, cityId, preferenceId]
    );
    const groupId = groupResult.rows[0].group_id;

    // Automatically set the user as an admin of the group
    await client.query(
      "INSERT INTO group_memberships (user_id, group_id, membership_status, role) VALUES ($1, $2, 'accepted', 'admin')",
      [userId, groupId]
    );

    res
      .status(201)
      .json({ message: "Group successfully created", groupId: groupId });
  } catch (err) {
    console.error("Error during group creation:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});
app.get("/games", async (req, res) => {
  try {
    const apiResponse = await fetch(
      `http://www.gamespot.com/api/games/?api_key=${process.env.GAME_NEWS_KEY}&format=json`
    );

    const apiData = await apiResponse.json();
    res.json(apiData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: GET /groups/manage-requests
app.get("/groups/manage-requests", async (req, res) => {
  const userId = req.userId;
  let client;

  try {
    client = await db.connect();
    const result = await client.query(
      `SELECT gm.membership_id as request_id, u.name || ' ' || u.surname as requester_name, 
              g.group_id, g.group_name, gm.membership_status
       FROM group_memberships gm
       JOIN users u ON gm.user_id = u.user_id
       JOIN groups g ON gm.group_id = g.group_id
       WHERE g.group_id IN 
         (SELECT group_id FROM group_memberships WHERE user_id = $1 AND role = 'admin')
       AND gm.membership_status = 'pending'
       AND gm.user_id != $1`, // Exclude the admin's own requests
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching group requests:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// Route: POST /groups/request
app.post("/groups/request", async (req, res) => {
  const userId = req.userId;
  const { groupId } = req.body;

  let client;
  try {
    client = await db.connect();

    // Check if the user is already a member or has an active (pending or accepted) request
    const existingMembershipCheck = await client.query(
      `SELECT * FROM group_memberships 
       WHERE user_id = $1 AND group_id = $2 AND membership_status != 'declined'`,
      [userId, groupId]
    );

    // If the user already has a membership or an active request, return an error
    if (existingMembershipCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You are already a member or have an active request." });
    }

    // Insert a new group membership request with a pending status
    await client.query(
      `INSERT INTO group_memberships (user_id, group_id, membership_status, role) 
       VALUES ($1, $2, 'pending', 'member')`,
      [userId, groupId]
    );

    res.json({ message: "Request sent successfully" });
  } catch (error) {
    console.error("Error sending group request:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

// PUT /groups/respond-to-request
app.put("/groups/respond-to-request", async (req, res) => {
  const { requestId, accept } = req.body;
  let client;

  try {
    client = await db.connect();

    // Validate requestId
    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    // Check if the request exists and is pending
    const checkRequest = await client.query(
      `SELECT * FROM group_memberships 
       WHERE membership_id = $1 AND membership_status = 'pending'`,
      [requestId]
    );

    if (checkRequest.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Request not found or already handled" });
    }

    // Update the membership status
    const updateStatus = accept ? "accepted" : "declined";
    const result = await client.query(
      `UPDATE group_memberships
       SET membership_status = $1
       WHERE membership_id = $2 RETURNING *`,
      [updateStatus, requestId]
    );

    res.json({
      message: `Membership request ${updateStatus}`,
      updatedRecord: result.rows[0],
    });
  } catch (error) {
    console.error("Error handling group request:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/groups/my-group", async (req, res) => {
  const userId = req.userId;

  let client;
  try {
    client = await db.connect();

    // Fetch all groups where the user is an admin and include details of accepted members
    const groupDetails = await client.query(
      `SELECT g.group_id, g.group_name, g.group_description, g.group_picture, g.creation_date, 
                     json_agg(json_build_object('user_id', u.user_id, 'name', u.name, 'surname', u.surname, 'role', gm.role)) FILTER (WHERE gm.membership_status = 'accepted') as members
             FROM groups g
             JOIN group_membership gm ON g.group_id = gm.group_id
             JOIN users u ON gm.user_id = u.user_id
             WHERE g.group_id IN 
                 (SELECT group_id FROM group_membership WHERE user_id = $1 AND role = 'admin')
             GROUP BY g.group_id`,
      [userId]
    );

    res.json(groupDetails.rows);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

app.put("/group/:groupId", authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  const { groupName, groupDescription, cityId } = req.body;
  const userId = req.userId;

  let client;
  try {
    client = await db.connect();

    // Verify if the user is an admin of the group
    const isAdminResult = await client.query(
      "SELECT * FROM group_membership WHERE user_id = $1 AND group_id = $2 AND role = 'admin'",
      [userId, groupId]
    );

    if (isAdminResult.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update group details
    await client.query(
      "UPDATE groups SET group_name = $1, group_description = $2, city_id = $3 WHERE group_id = $4",
      [groupName, groupDescription, cityId, groupId]
    );

    res.json({ message: "Group updated successfully" });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/user/groups", authenticateJWT, async (req, res) => {
  const userId = req.userId;
  let client;

  try {
    const client = await db.connect();

    // Récupérer les groupes créés par l'utilisateur
    const createdGroups = await client.query(
      "SELECT * FROM groups WHERE group_id IN (SELECT group_id FROM group_membership WHERE user_id = $1 AND role = 'admin')",
      [userId]
    );

    // Récupérer les groupes dont l'utilisateur est membre
    const memberGroups = await client.query(
      "SELECT * FROM groups WHERE group_id IN (SELECT group_id FROM group_membership WHERE user_id = $1 AND role = 'member')",
      [userId]
    );

    res.json({
      createdGroups: createdGroups.rows,
      memberGroups: memberGroups.rows,
    });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Route to delete a group
app.delete("/group/:groupId", authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;
  let client;

  try {
    client = await db.connect();

    // Verify if the user is an admin of the group
    const isAdminResult = await client.query(
      "SELECT * FROM group_membership WHERE user_id = $1 AND group_id = $2 AND role = 'admin'",
      [userId, groupId]
    );

    if (isAdminResult.rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // First, delete related entries in group_membership
    await client.query("DELETE FROM group_membership WHERE group_id = $1", [
      groupId,
    ]);

    // Then, delete the group itself
    await client.query("DELETE FROM groups WHERE group_id = $1", [groupId]);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

app.delete(
  "/group/:groupId/member/:memberId",
  authenticateJWT,
  async (req, res) => {
    const { groupId, memberId } = req.params;
    const requestorId = req.userId;
    let client;

    if (memberId === requestorId) {
      return res
        .status(403)
        .json({ error: "You cannot remove yourself from the admin role." });
    }

    try {
      client = await db.connect();

      // Check if the requester is the admin of the group
      const isAdmin = await client.query(
        "SELECT * FROM group_membership WHERE user_id = $1 AND group_id = $2 AND role = 'admin'",
        [requestorId, groupId]
      );

      if (isAdmin.rows.length === 0 || memberId === requestorId) {
        return res
          .status(403)
          .json({ error: "Unauthorized or invalid action" });
      }

      // Delete the member from the group
      await client.query(
        "DELETE FROM group_membership WHERE user_id = $1 AND group_id = $2",
        [memberId, groupId]
      );

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

app.get("/group/:groupId/members", authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  let client;

  try {
    client = await db.connect();
    const result = await client.query(
      "SELECT u.user_id, u.name, u.surname FROM group_membership gm JOIN users u ON gm.user_id = u.user_id WHERE gm.group_id = $1",
      [groupId]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/group/:groupId", authenticateJWT, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;
  let client;

  try {
    client = await db.connect();

    // Fetch group details
    const groupDetailsResult = await client.query(
      "SELECT group_id, group_name, group_description, group_picture, creation_date FROM groups WHERE group_id = $1",
      [groupId]
    );

    if (groupDetailsResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Fetch group members
    const membersResult = await client.query(
      "SELECT u.user_id, u.name, u.surname, gm.role FROM group_membership gm JOIN users u ON gm.user_id = u.user_id WHERE gm.group_id = $1 AND gm.membership_status = 'accepted'",
      [groupId]
    );

    const group = groupDetailsResult.rows[0];
    const members = membersResult.rows;

    const isAdmin = members.some(
      (member) => member.user_id === userId && member.role === "admin"
    );
    const isMember = members.some(
      (member) => member.user_id === userId && member.role !== "admin"
    );

    res.json({
      ...group,
      members: members,
      is_admin: isAdmin,
      is_member: isMember,
    });
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
