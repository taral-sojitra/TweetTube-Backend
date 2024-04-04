import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const existingSubscription = await Subscription.findOneAndDelete({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (existingSubscription) {
    return res.status(200).json(new ApiResponse(200, { isSubscribed: false }));
  }

  const newSubscription = await Subscription.create({
    channel: channelId,
    subscriber: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed: !!newSubscription }, "Subscription toggled successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber");

  if (!subscribers?.length) {
    throw new ApiError(404, "No subscribers found for this channel");
  }

  return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscribedChannels = await Subscription.find({ subscriber: subscriberId }).populate("channel");

  if (!subscribedChannels?.length) {
    throw new ApiError(404, "No subscribed channels found for this user");
  }

  return res.status(200).json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

// import mongoose, { isValidObjectId } from "mongoose";
// // eslint-disable-next-line no-unused-vars
// import { User } from "../models/user.model.js";
// import { Subscription } from "../models/subscription.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const toggleSubscription = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;

//   if (!isValidObjectId(channelId)) {
//     throw new ApiError(400, "Invalid channelId");
//   }

//   const likedAlready = await Subscription.findOne({
//     channel: channelId,
//     subscriber: req.user?._id,
//   });

//   if (likedAlready) {
//     await Subscription.findByIdAndDelete(likedAlready?._id);

//     return res.status(200).json(new ApiResponse(200, { isSubscribed: false }));
//   }

//   await Subscription.create({
//     channel: channelId,
//     subscriber: req.user?._id,
//   });

//   return res.status(200).json(new ApiResponse(200, { isSubscribed: true }, "Subscribed like is done successfully"));
// });

// // controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//   const { subscriberId } = req.params;

//   if (!isValidObjectId(subscriberId)) {
//     throw new ApiError(400, "Invalid subscriberId");
//   }

//   const allSubscriber = await Subscription.aggregate([
//     {
//       $match: {
//         channel: new mongoose.Types.ObjectId(subscriberId),
//       },
//     },
//   ]);

//   if (!allSubscriber?.length) {
//     throw new ApiError(500, "facing issue while fetching allsubscriber");
//   }

//   return res.status(200).json(new ApiResponse(200, allSubscriber, "All Subscriber fetch successfully"));
// });

// // controller to return channel list to which user has subscribed
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;

//   if (!isValidObjectId(channelId)) {
//     throw new ApiError(400, "Invalid channelId");
//   }

//   const allSubscriber = await Subscription.aggregate([
//     {
//       $match: {
//         channel: new mongoose.Types.ObjectId(channelId),
//       },
//     },
//   ]);

//   if (!allSubscriber?.length) {
//     throw new ApiError(500, "facing issue while fetching allsubscriber");
//   }

//   return res.status(200).json(new ApiResponse(200, allSubscriber, "All Subscriber fetch successfully"));
// });

// export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
