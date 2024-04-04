import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const currentUserId = req.user?._id;

  if (!content) {
    throw new ApiError(400, "Tweet content is required");
  }

  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const tweet = await Tweet.create({
    content,
    owner: currentUserId,
  });

  return res.status(201).json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const tweets = await Tweet.find({ owner: userId });

  if (!tweets?.length) {
    throw new ApiError(404, "No tweets found for this user");
  }

  return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { editedTweet } = req.body;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  if (!editedTweet) {
    throw new ApiError(400, "Edited tweet content is required");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { content: editedTweet }, { new: true });

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

// // eslint-disable-next-line no-unused-vars
// import mongoose, { isValidObjectId } from "mongoose";
// import { Tweet } from "../models/tweet.model.js";
// // eslint-disable-next-line no-unused-vars
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const createTweet = asyncHandler(async (req, res) => {
//   const { content } = req.body;
//   const currentUserId = req.user?._id;

//   if (!content) {
//     throw new ApiError(401, "Tweet data is not defined");
//   }

//   if (!currentUserId) {
//     throw new ApiError(401, "User is not defined");
//   }

//   const tweet = await Tweet.create({
//     content,
//     owner: currentUserId,
//   });

//   return res.status(201).json(new ApiResponse(200, tweet, "tweet created successfully"));
// });

// const getUserTweets = asyncHandler(async (req, res) => {
//   const { userId } = req.params;

//   if (!userId) {
//     throw new ApiError(401, "Uanthorized user");
//   }

//   const tweets = await Tweet.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//   ]);

//   if (!tweets?.length) {
//     throw new ApiError(404, "Tweets is not done by user");
//   }

//   return res.status(200).json(new ApiResponse(200, tweets, "all tweets by user fetched successfully"));
// });

// const updateTweet = asyncHandler(async (req, res) => {
//   const { tweetId } = req.params;
//   const { editedTweet } = req.body;

//   if (!tweetId) {
//     throw new ApiError(400, "tweetId is missing");
//   }
//   if (!editedTweet) {
//     throw new ApiError(400, "editedTweet is missing");
//   }

//   const tweet = await Tweet.findByIdAndUpdate(
//     tweetId,
//     {
//       $set: { content: editedTweet },
//     },
//     {
//       new: true,
//     }
//   );

//   return res.status(200).json(new ApiResponse(200, tweet, "tweet updated successfully"));
// });

// const deleteTweet = asyncHandler(async (req, res) => {
//   const { tweetId } = req.params;

//   if (!tweetId) {
//     throw new ApiError(400, "tweetId is missing");
//   }

//   await Tweet.findByIdAndDelete(tweetId);

//   return res.status(200).json(new ApiResponse(200, {}, "tweet delete successfully"));
// });

// export { createTweet, getUserTweets, updateTweet, deleteTweet };
