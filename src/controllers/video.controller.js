import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

// eslint-disable-next-line no-unused-vars
const getAllVideos = asyncHandler(async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pipeline = [];

  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results
  // here the name of search index is 'search-videos'
  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res.status(200).json(new ApiResponse(200, video, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const currentUserId = req.user?._id;

  if (!currentUserId) {
    throw new ApiError(401, "User is not defined");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail?.url ?? "",
    title,
    description,
    duration: videoFile.duration,
    owner: currentUserId,
  });

  return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

// eslint-disable-next-line no-unused-vars
const getVideoById = asyncHandler(async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid userId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "failed to fetch video");
  }

  // increment views if video fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // add this video to user watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res.status(200).json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const videoLocalPath = req.files?.video[0]?.path;

  if (!title && !description && !videoLocalPath) {
    throw new ApiError(400, "Title, description, or video file is missing");
  }

  const updatedVideo = await uploadOnCloudinary(videoLocalPath);

  if (!updatedVideo) {
    throw new ApiError(400, "Failed to update video file on Cloudinary");
  }

  const updatedFields = { title, description, videoFile: updatedVideo.url };
  const video = await Video.findByIdAndUpdate(videoId, updatedFields, { new: true });

  return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is missing");
  }

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "You can't toggle publish status as you are not the owner");
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    { isPublished: !video.isPublished },
    { new: true }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toggle video publish status");
  }

  return res.status(200).json(new ApiResponse(200, toggledVideoPublish, "Video publish status toggled successfully"));
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };

// // eslint-disable-next-line no-unused-vars
// import mongoose, { isValidObjectId } from "mongoose";
// import { Video } from "../models/video.model.js";
// // eslint-disable-next-line no-unused-vars
// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";

// // eslint-disable-next-line no-unused-vars
// const getAllVideos = asyncHandler(async (req, res) => {
//   // eslint-disable-next-line no-unused-vars
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination
// });

// const publishAVideo = asyncHandler(async (req, res) => {
//   const { title, description } = req.body;
//   const currentUserId = req.user?._id;

//   if (!currentUserId) {
//     throw new ApiError(401, "User is not defined");
//   }

//   if ([title, description].some((field) => field?.trim() === "")) {
//     throw new ApiError(400, "some fields are missing");
//   }

//   const videoFileLocalPath = req.files?.videoFile[0]?.path;

//   let thumbnailLocalPath;
//   if (req.files && Array.isArray(req.files?.thumbnail) && req.files.thumbnail.length > 0) {
//     thumbnailLocalPath = req.files?.thumbnail[0]?.path;
//   }

//   const videoFile = await uploadOnCloudinary(videoFileLocalPath);
//   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

//   if (!videoFile) {
//     throw new ApiError(400, "VideoFile is required");
//   }

//   const video = await Video.create({
//     videoFile: videoFile.url,
//     thumbnail: thumbnail?.url ?? "",
//     title: title,
//     description: description,
//     duration: videoFile.duration,
//     owner: currentUserId,
//   });

//   if (!video) {
//     throw new ApiError(500, "something went wrong while uploading video");
//   }

//   return res.status(201).json(new ApiResponse(200, video, "video is uploaded successfully"));
// });

// // eslint-disable-next-line no-unused-vars
// const getVideoById = asyncHandler(async (req, res) => {
//   // eslint-disable-next-line no-unused-vars
//   const { videoId } = req.params;
//   //TODO: get video by id
// });

// const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   const { title, description } = req.body;

//   if (!(title || description)) {
//     throw new ApiError(400, "some field data is missing");
//   }

//   const videoLocalPath = req.file?.path;

//   if (!videoLocalPath) {
//     throw new ApiError(400, "video file is missing");
//   }

//   const updatedVideo = await uploadOnCloudinary(videoLocalPath);

//   if (!updatedVideo) {
//     throw new ApiError(400, "updatedVideo file failed on cloudinary");
//   }

//   const video = await Video.findByIdAndUpdate(
//     videoId,
//     {
//       $set: {
//         video: updatedVideo.url,
//         title,
//         description,
//       },
//     },
//     {
//       new: true,
//     }
//   );

//   return res.status(200).json(new ApiResponse(200, video, "avatar updated succesfully"));
// });

// const deleteVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;

//   if (!videoId) {
//     throw new ApiError(400, "videoId is missing");
//   }

//   const video = await Video.findByIdAndDelete(videoId, function (err, docs) {
//     if (err) {
//       throw new ApiError(500, err?.message);
//     } else {
//       console.log("Deleted : ", docs);
//     }
//   });

//   return res.status(200).json(new ApiResponse(200, video, "video deleted successfully"));
// });

// const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;

//   const video = await Video.findById(videoId);

//   if (!video) {
//     throw new ApiError(404, "Video not found");
//   }

//   if (video?.owner.toString() !== req.user?._id.toString()) {
//     throw new ApiError(400, "You can't toogle publish status as you are not the owner");
//   }

//   const toggledVideoPublish = await Video.findByIdAndUpdate(
//     videoId,
//     {
//       $set: {
//         isPublished: !video?.isPublished,
//       },
//     },
//     { new: true }
//   );

//   if (!toggledVideoPublish) {
//     throw new ApiError(500, "toggledVideoPublish updation was not done successfully");
//   }

//   return res.status(200).json(new ApiResponse(200, toggledVideoPublish, "video publish status toggled successfully"));
// });

// export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
