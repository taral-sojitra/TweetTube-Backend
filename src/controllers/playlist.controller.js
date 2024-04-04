import mongoose from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const currentUserId = req.user?._id;

  if (!currentUserId) {
    throw new ApiError(401, "User is not defined");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name or description is missing");
  }

  const playlist = await PlayList.create({
    name,
    description,
    owner: currentUserId,
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res.status(201).json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const playlists = await PlayList.find({ owner: userId }).populate("videos");

  if (!playlists?.length) {
    throw new ApiError(404, "No playlists found for this user");
  }

  return res.status(200).json(new ApiResponse(200, playlists, "User's playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "PlaylistId is missing");
  }

  const playlist = await PlayList.findById(playlistId).populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to add video to this playlist");
  }

  playlist.videos.addToSet(videoId);
  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  const playlist = await PlayList.findByIdAndUpdate(playlistId, { $pull: { videos: videoId } }, { new: true });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "PlaylistId is missing");
  }

  await PlayList.findByIdAndDelete(playlistId);

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "PlaylistId is missing");
  }

  if (!name && !description) {
    throw new ApiError(400, "Name or description is missing");
  }

  const playlist = await PlayList.findByIdAndUpdate(playlistId, { $set: { name, description } }, { new: true });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

// import mongoose, { isValidObjectId } from "mongoose";
// import { PlayList } from "../models/playlist.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { Video } from "../models/video.model.js";

// const createPlaylist = asyncHandler(async (req, res) => {
//   const { name, description } = req.body;
//   const currentUserId = req.user?._id;

//   if (!currentUserId) {
//     throw new ApiError(401, "User is not defined");
//   }

//   if (!(name || description)) {
//     throw new ApiError(400, "some field data is missing");
//   }

//   const playList = await PlayList.create({
//     name,
//     description,
//     owner: currentUserId,
//   });

//   if (!playList) {
//     throw new ApiError(500, "something went wrong while creating user");
//   }

//   return res.status(201).json(new ApiResponse(200, playList, "playList created successfully"));
// });

// const getUserPlaylists = asyncHandler(async (req, res) => {
//   const { userId } = req.params;

//   const playLists = await PlayList.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "videos",
//         foreignField: "_id",
//         as: "videos",
//       },
//     },
//   ]);

//   if (!playLists?.length) {
//     throw new ApiError(404, "playLists does not exists");
//   }

//   return res.status(200).json(new ApiResponse(200, playLists, "playLists was fetched successfully"));
// });

// const getPlaylistById = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;

//   if (!playlistId?.trim()) {
//     throw new ApiError(400, "playlistId is missing");
//   }

//   const playList = await PlayList.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(playlistId),
//       },
//     },
//   ]);

//   if (!playList?.length) {
//     throw new ApiError(404, "playList does not exists");
//   }

//   return res.status(200).json(new ApiResponse(200, playList, "playList was fetched successfully"));
// });

// const addVideoToPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;

//   if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid PlaylistId or videoId");
//   }

//   const playlist = await PlayList.findById(playlistId);
//   const video = await Video.findById(videoId);

//   if (!playlist) {
//     throw new ApiError(404, "Playlist not found");
//   }
//   if (!video) {
//     throw new ApiError(404, "video not found");
//   }

//   if ((playlist.owner?.toString() && video.owner.toString()) !== req.user?._id.toString()) {
//     throw new ApiError(400, "only owner can add video to thier playlist");
//   }

//   const updatedPlaylist = await PlayList.findByIdAndUpdate(
//     playlist?._id,
//     {
//       $addToSet: {
//         videos: videoId,
//       },
//     },
//     { new: true }
//   );

//   if (!updatedPlaylist) {
//     throw new ApiError(400, "failed to add video to playlist please try again");
//   }

//   return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Added video to playlist successfully"));
// });

// const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;

//   if (!(playlistId || videoId)) {
//     throw new ApiError(400, "some field data is missing");
//   }

//   const playList = await PlayList.findByIdAndUpdate(
//     playlistId,
//     {
//       $pull: {
//         videos: videoId,
//       },
//     },
//     {
//       new: true,
//     }
//   );

//   return res.status(200).json(new ApiResponse(200, playList, "video removed successfully from playList"));
// });

// const deletePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;

//   if (!playlistId) {
//     throw new ApiError(400, "playlistId is missing");
//   }

//   await PlayList.findByIdAndDelete(playlistId);

//   return res.status(200).json(new ApiResponse(200, {}, "PlayList deleted successfully"));
// });

// const updatePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;
//   const { name, description } = req.body;

//   if (!(name || description)) {
//     throw new ApiError(400, "some field data is missing");
//   }

//   if (!playlistId) {
//     throw new ApiError(400, "play list id is missing");
//   }

//   const playList = await PlayList.findByIdAndUpdate(
//     playlistId,
//     {
//       $set: {
//         name,
//         description,
//       },
//     },
//     {
//       new: true,
//     }
//   );

//   return res.status(200).json(new ApiResponse(200, playList, "PlayList updated successfully"));
// });

// export {
//   createPlaylist,
//   getUserPlaylists,
//   getPlaylistById,
//   addVideoToPlaylist,
//   removeVideoFromPlaylist,
//   deletePlaylist,
//   updatePlaylist,
// };
