const db = require("../config/dbConnection");

const newScreen = async (
  pairingCode,
  screenName,
  tags,
  location,
  city,
  state,
  country,
  pincode
) => {
  try {
    const result = await db.query(
      "INSERT INTO screens (PairingCode,ScreenName,Tags,Location,City,State,Country,Pincode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [pairingCode, screenName, tags, location, city, state, country, pincode]
    );

    return result.rows;
  } catch (err) {
    console.error("error occur at add new Screen in Screen:", err);
    throw err;
  }
};

const screenByPairingCode = async (pairingCode) => {
  try {
    const result = await db.query(
      "SELECT * FROM screens WHERE PairingCode=$1",
      [pairingCode]
    );
    return result.rows;
  } catch (err) {
    console.error("Error occurred at find SCREEN in SCREEN TABLE:", err);
    throw err;
  }
};
const screenByName = async (screenName) => {
  try {
    const result = await db.query(
      "SELECT * FROM screens WHERE screenname=$1",
      [screenName]
    );
    return result.rows;
  } catch (err) {
    console.error("Error occurred at find SCREEN name in SCREEN TABLE:", err);
    throw err;
  }
};
const getAllScreens = async () => {
  try {
    const result = await db.query("SELECT * FROM screens ORDER BY screenid DESC");
    return result.rows;
  } catch (err) {
    console.error("Error occurred at fetching all screens:", err);
    throw err;
  }
};

const getNotdeletedScreen = async () => {
  try {
    const result = await db.query(
      "SELECT * FROM screens WHERE  deleted = false ORDER BY screenid DESC"
    );
    return result.rows;
  } catch (err) {
    console.error("Error occurred at fetching all screens:", err);
    throw err;
  }
};

const updateDeleteScreen = async (pairingCode) => {
  try {
    const result = await db.query(
      "UPDATE screens SET deleted = true WHERE pairingcode = $1",
      [pairingCode]
    );
 
  } catch (err) {
    console.error("Error updating screen:", err);
    res.status(500).send("Error updating screen");
  }
};

const restoreScreenInDB = async (pairingCode) => {
  try {
    const result = await db.query(
      "UPDATE screens SET deleted = false WHERE pairingcode = $1",
      [pairingCode]
    );
    return result.rows;
  } catch (err) {
    console.error("Error restoring  screen:", err);
    res.status(500).send("Error restoring  screen");
  }
};

const editScreen = async (
  pairingCode,
  screenName,
  tags,
  location,
  city,
  state,
  country,
  pincode
) => {
  try {
    const result = await db.query(
      "UPDATE screens SET screenname = $2, tags = $3, location = $4, city = $5, state = $6, country = $7, pincode = $8 WHERE pairingcode = $1",
      [pairingCode, screenName, tags, location, city, state, country, pincode]
    );
    return result.rows;
  } catch (err) {
    console.error("Error updating screen:", err);
    throw err;
  }
};

const getTotalScreenCount = async () => {
  try {
    const result = await db.query("SELECT COUNT(*) AS count FROM screens");
    return result.rows[0].count;
  } catch (error) {
    console.error("Error fetching screen count:", error);
    throw error;
  }
};

const getNotDeletedScreenCount = async () => {
  try {
    const result = await db.query(
      "SELECT COUNT(*) AS count FROM screens WHERE deleted=false"
    );
    return result.rows[0].count;
  } catch (error) {
    console.error("Error fetching not deleted screen count:", error);
    throw error;
  }
};

const getDeletedScreenCount = async () => {
  try {
    const result = await db.query(
      "SELECT COUNT(*) AS count FROM screens WHERE deleted=true"
    );
    return result.rows[0].count;
  } catch (error) {
    console.error("Error fetching  deleted screen count:", error);
    throw error;
  }
};

const getDeletedScreen = async () => {
  try {
    const result = await db.query(
      "SELECT * FROM screens WHERE deleted = true ORDER BY screenid DESC"
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching deleted screens:", err);
    throw err;
  }
};

const getGroupScreen=async () => {
try {
  const result = await db.query(
    "SELECT * FROM  groupscreen WHERE deleted=false"
  );
  return result.rows;
} catch (err) {
  console.error("Error occurred at fetching group screens:", err);
  throw err;
}}

const deletePlaylist = async (screenid) => {

  try {
    // Construct the SQL query to update fields to NULL
    const query = `
      UPDATE screens
      SET playlistname = NULL,
          playlistdescription = NULL,
          slot1 = NULL,
          slot2 = NULL,
          slot3 = NULL,
          slot4 = NULL,
          slot5 = NULL,
          slot6 = NULL,
          slot7 = NULL,
          slot8 = NULL,
          slot9 = NULL,
          slot10 = NULL
      WHERE screenid = $1
      RETURNING *
    `;
    
    // Execute the query with the screenId parameter
    const rows  = await db.query(query, [screenid]);

    return rows[0];

    
  } catch (error) {
    console.error("Error deleting playlist:", error);
    // res.status(500).json({ error: "Failed to delete playlist" });
  }
};


const deleteScreenById = async (screenid) => {
  const query = 'DELETE FROM screens WHERE screenid = $1';
  const values = [screenid];
  try {
      const result = await db.query(query, values);
      return result.rowCount > 0; // returns true if a row was deleted
  } catch (error) {
      throw error;
  }
};
module.exports = {
  restoreScreenInDB,
  newScreen,
  screenByPairingCode,
  getAllScreens,
  getNotdeletedScreen,
  updateDeleteScreen,
  editScreen,
  getTotalScreenCount,
  getNotDeletedScreenCount,
  getDeletedScreenCount,
  getDeletedScreen,
  getGroupScreen,
  deletePlaylist,
  deleteScreenById,
  screenByName
};