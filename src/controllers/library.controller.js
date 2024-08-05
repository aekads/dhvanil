const library = require("../models/library.model");
const cloudinary = require("../config/cloudinaryConfig");
const { Log } = require('../models/log.model');

// Helper function to log actions
const logAction = async (action, message, ip) => {
  try {
    await Log.create({ action, message, ip });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

const handleUploadInDB = async (req, res) => {
  if (!req.file) {
    const errorMsg = "No file uploaded";
    await logAction('UPLOAD', errorMsg, req.ip);
    return res.status(400).send(errorMsg);
  }

  console.log(req.file);
  const fileUrl = req.file.path;
  const fileType = req.file.mimetype;
  const fileName = req.file.originalname;
  let duration;

  if (fileType.startsWith("video/")) {
    try {
      const publicId = req.file.filename;
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "video",
        media_metadata: true,
      });
      duration = result.duration ? Math.ceil(result.duration) : 0;
      console.log("Duration:", result.duration);
    } catch (err) {
      console.error("Error fetching video duration from Cloudinary:", err);
      duration = 0;
    }
  }

  const fileSizeBytes = req.file.size;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

  try {
    if (fileType.startsWith("video/")) {
      await library.uploadMediaInDB(fileUrl, fileType, fileName, duration, fileSizeMB);
    } else {
      await library.uploadMediaInDB(fileUrl, fileType, fileName, null, fileSizeMB);
    }
    const mediafiles = await library.viewMedia();
    const fileCount = await library.getmediafileCount();
    await logAction('UPLOAD', `video uploaded: ${fileName}`, req.ip);
    res.render("Library", { mediafiles: mediafiles, fileCount });
  } catch (err) {
    console.error(err);
    await logAction('UPLOAD', `Error uploading file: ${fileName}`, req.ip);
    res.status(500).send("Error uploading file");
  }
};

const handleUploadInDBForNewPlaylist = async (req, res) => {
  if (!req.file) {
    const errorMsg = "No file uploaded";
    await logAction('UPLOAD', errorMsg, req.ip);
    return res.status(400).send(errorMsg);
  }

  console.log(req.file);
  const fileUrl = req.file.path;
  const fileType = req.file.mimetype;
  const fileName = req.file.originalname;
  let duration;

  if (fileType.startsWith("video/")) {
    try {
      const publicId = req.file.filename;
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "video",
        media_metadata: true,
      });
      duration = result.duration ? Math.ceil(result.duration) : 0;
      console.log("Duration:", result.duration);
    } catch (err) {
      console.error("Error fetching video duration from Cloudinary:", err);
      duration = 0;
    }
  }

  const fileSizeBytes = req.file.size;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

  try {
    if (fileType.startsWith("video/")) {
      await library.uploadMediaInDB(fileUrl, fileType, fileName, duration, fileSizeMB);
    } else {
      await library.uploadMediaInDB(fileUrl, fileType, fileName, null, fileSizeMB);
    }
    const mediafiles = await library.viewMedia();
    const fileCount = await library.getmediafileCount();
    await logAction('UPLOAD', `File uploaded for new playlist: ${fileName}`, req.ip);
    res.render("newPlaylist", { mediafiles: mediafiles, fileCount });
  } catch (err) {
    console.error(err);
    await logAction('UPLOAD', `Error uploading file for new playlist: ${fileName}`, req.ip);
    res.status(500).send("Error uploading file");
  }
};

const viewMedia = async (req, res) => {
  try {
    const mediafiles = await library.viewMedia();
    const fileCount = await library.getmediafileCount();
   
    res.render("Library", { mediafiles: mediafiles, fileCount });
  } catch (err) {
    console.error(err);
    
    res.status(500).send("Error viewing media");
  }
};

const viewMediaForPlaylist = async (req, res) => {
  try {
    const mediafiles = await library.viewMedia();
    const convertedMediaFiles = mediafiles.map(file => {
      const durationString = intervalToString(file.duration);
      return { ...file, durationString };
    });
   
    res.render("newPlaylist", { mediafiles: convertedMediaFiles });
  } catch (err) {
    console.error(err);
    
    res.status(500).send("Error viewing media for Playlist");
  }
};

function intervalToString(interval) {
  const hours = interval.hours ? `${interval.hours}h ` : '';
  const minutes = interval.minutes ? `${interval.minutes}m ` : '';
  const seconds = interval.seconds ? `${interval.seconds} sec` : '';
  return `${hours}${minutes}${seconds}`.trim();
}

const getPhotoes = async (req, res) => {
  try {
    const mediafiles = await library.getPhotoes();
    const fileCount = await library.getmediafileCount();
    await logAction('Image/video', 'Add photos', req.ip);
    res.render("Library", { mediafiles: mediafiles, fileCount });
  } catch (err) {
    console.error(err);
   
    res.status(500).send("Error viewing Photos");
  }
};

const getPhotoesForPlaylist = async (req, res) => {
  try {
    const mediafiles = await library.getPhotoes();
    await logAction('Image/video', 'Add photos', req.ip);
    res.render("newPlaylist", { mediafiles: mediafiles });
  } catch (err) {
    console.error(err);
  
    res.status(500).send("Error viewing Photos for playlist");
  }
};

const getVideos = async (req, res) => {
  try {
    const mediafiles = await library.getVideos();
    const fileCount = await library.getmediafileCount();
    await logAction('VIEW', 'Viewed videos', req.ip);
    res.render("Library", { mediafiles: mediafiles, fileCount });
  } catch (err) {
    console.error(err);
    await logAction('VIEW', 'Error viewing videos', req.ip);
    res.status(500).send("Error viewing video media");
  }
};

const getVideosForPlaylist = async (req, res) => {
  try {
    const mediafiles = await library.getVideos();
    await logAction('VIEW', 'Viewed videos for playlist', req.ip);
    res.render("newPlaylist", { mediafiles: mediafiles });
  } catch (err) {
    console.error(err);
    await logAction('VIEW', 'Error viewing videos for playlist', req.ip);
    res.status(500).send("Error viewing video media for Playlist");
  }
};

const deleteMedia = async (req, res) => {
  const { id } = req.params;
  try {
    await library.deleteMediaById(id);
    // Optionally, delete from Cloudinary or other storage
    await logAction('DELETE', `Media deleted with ID: ${id}`, req.ip);
    res.redirect('/Dashboard/Library');
  } catch (err) {
    console.error(err);
    await logAction('DELETE', `Error deleting media with ID: ${id}`, req.ip);
    res.status(500).send("Error deleting media file");
  }
};

module.exports = {
  handleUploadInDB,
  handleUploadInDBForNewPlaylist,
  viewMedia,
  getPhotoes,
  getPhotoesForPlaylist,
  getVideos,
  getVideosForPlaylist,
  deleteMedia,
  intervalToString,
  viewMediaForPlaylist
};
