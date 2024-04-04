import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get comments for a specific video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate videoId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  // Pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // Fetch comments for the video
  const comments = await Comment.paginate({ video: videoId }, options);

  return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const currentUserId = req.user?._id;

  // Validate input
  if (!videoId || !content) {
    throw new ApiError(400, "Both videoId and content are required");
  }

  // Create the comment
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: currentUserId,
  });

  return res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { editedComment } = req.body;

  // Validate input
  if (!mongoose.isValidObjectId(commentId) || !editedComment) {
    throw new ApiError(400, "Both commentId and editedComment are required");
  }

  // Update the comment
  const comment = await Comment.findByIdAndUpdate(commentId, { content: editedComment }, { new: true });

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Validate input
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  // Delete the comment
  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };

// import mongoose from "mongoose";
// import { Comment } from "../models/comment.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const getVideoComments = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   // eslint-disable-next-line no-unused-vars
//   const { page = 1, limit = 10 } = req.query;

//   const comments = await Comment.aggregate([
//     {
//       $match: {
//         video: new mongoose.Types.ObjectId(videoId),
//       },
//     },
//   ]);

//   return res.status(200).json(new ApiResponse(200, comments, "comments fetched successFully"));
// });

// const addComment = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   const { content } = req.body;
//   const currentUserId = req.user?._id;

//   if (!videoId) {
//     throw new ApiError(400, "videoId field are missing");
//   }

//   if (!content) {
//     throw new ApiError(400, "editedTweet is missing");
//   }

//   if (!currentUserId) {
//     throw new ApiError(401, "User is not defined");
//   }

//   const comment = await Comment.create({
//     content,
//     video: videoId,
//     owner: currentUserId,
//   });

//   if (!comment) {
//     throw new ApiError(500, "something went wrong while creating user");
//   }

//   return res.status(201).json(new ApiResponse(200, comment, "comment created successfully"));
// });

// const updateComment = asyncHandler(async (req, res) => {
//   const { commentId } = req.params;
//   const { editedComment } = req.body;

//   if (!(commentId || editedComment)) {
//     throw new ApiError(400, "some field data is missing");
//   }

//   const commnet = await Comment.findByIdAndUpdate(
//     commentId,
//     {
//       $set: { content: editedComment },
//     },
//     {
//       new: true,
//     }
//   );

//   return res.status(200).json(new ApiResponse(200, commnet, "commnet updated successfully"));
// });

// const deleteComment = asyncHandler(async (req, res) => {
//   const { commentId } = req.params;

//   if (!commentId) {
//     throw new ApiError(400, "commentId is missing");
//   }

//   await Comment.findByIdAndDelete(commentId);

//   return res.status(200).json(new ApiResponse(200, {}, "commnet deleted successfully"));
// });

// export { getVideoComments, addComment, updateComment, deleteComment };
