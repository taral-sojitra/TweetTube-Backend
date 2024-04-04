import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like for a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  let like = await Like.findOne({ video: videoId, likedBy: req.user?._id });

  if (!like) {
    like = await Like.create({ video: videoId, likedBy: req.user?._id });
  } else {
    await like.delete();
  }

  const isLiked = !like;

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked }, `Video like ${isLiked ? "added" : "removed"} successfully`));
});

// Toggle like for a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  let like = await Like.findOne({ comment: commentId, likedBy: req.user?._id });

  if (!like) {
    like = await Like.create({ comment: commentId, likedBy: req.user?._id });
  } else {
    await like.delete();
  }

  const isLiked = !like;

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked }, `Comment like ${isLiked ? "added" : "removed"} successfully`));
});

// Toggle like for a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  let like = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id });

  if (!like) {
    like = await Like.create({ tweet: tweetId, likedBy: req.user?._id });
  } else {
    await like.delete();
  }

  const isLiked = !like;

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked }, `Tweet like ${isLiked ? "added" : "removed"} successfully`));
});

// Get liked videos by current user
const getLikedVideos = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;

  if (!currentUserId) {
    throw new ApiError(401, "User is not defined");
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(currentUserId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
      },
    },
  ]);

  if (!likedVideos?.length) {
    throw new ApiError(400, "User has not liked any video");
  }

  return res.status(200).json(new ApiResponse(200, likedVideos, "User's liked videos list"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

// import mongoose, { isValidObjectId } from "mongoose";
// import { Like } from "../models/like.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const toggleVideoLike = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;

//   if (!isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid videoId");
//   }

//   const likedAlready = await Like.findOne({
//     video: videoId,
//     likedBy: req.user?._id,
//   });

//   if (likedAlready) {
//     await Like.findByIdAndDelete(likedAlready?._id);

//     return res.status(200).json(new ApiResponse(200, { isLiked: false }));
//   }

//   await Like.create({
//     video: videoId,
//     likedBy: req.user?._id,
//   });

//   return res.status(200).json(new ApiResponse(200, { isLiked: true }, "video like is done successfully"));
// });

// const toggleCommentLike = asyncHandler(async (req, res) => {
//   const { commentId } = req.params;

//   if (!isValidObjectId(commentId)) {
//     throw new ApiError(400, "Invalid videoId");
//   }

//   const likedAlready = await Like.findOne({
//     comment: commentId,
//     likedBy: req.user?._id,
//   });

//   if (likedAlready) {
//     await Like.findByIdAndDelete(likedAlready?._id);

//     return res.status(200).json(new ApiResponse(200, { isLiked: false }));
//   }

//   await Like.create({
//     comment: commentId,
//     likedBy: req.user?._id,
//   });

//   return res.status(200).json(new ApiResponse(200, { isLiked: true }, "comment like is done successfully"));
// });

// const toggleTweetLike = asyncHandler(async (req, res) => {
//   const { tweetId } = req.params;

//   if (!isValidObjectId(tweetId)) {
//     throw new ApiError(400, "Invalid videoId");
//   }

//   const likedAlready = await Like.findOne({
//     tweet: tweetId,
//     likedBy: req.user?._id,
//   });

//   if (likedAlready) {
//     await Like.findByIdAndDelete(likedAlready?._id);

//     return res.status(200).json(new ApiResponse(200, { isLiked: false }));
//   }

//   await Like.create({
//     tweet: tweetId,
//     likedBy: req.user?._id,
//   });

//   return res.status(200).json(new ApiResponse(200, { isLiked: true }, "tweet like is done successfully"));
// });

// const getLikedVideos = asyncHandler(async (req, res) => {
//   const currentUserId = req.user?._id;

//   if (!currentUserId) {
//     throw new ApiError(401, "User is not defined");
//   }

//   const likedVideos = await Like.aggregate([
//     {
//       $match: {
//         likedBy: new mongoose.Types.ObjectId(currentUserId),
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "video",
//         foreignField: "_id",
//         as: "videos",
//       },
//     },
//   ]);

//   if (!likedVideos?.length) {
//     throw new ApiError(400, "User have not liked any video");
//   }
//   return res.status(200).json(new ApiResponse(200, likedVideos, "User Liked video list is here"));
// });

// export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
