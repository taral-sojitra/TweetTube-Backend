const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // If headers have already been sent to the client, just delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Customize error message based on the environment
  if (process.env.NODE_ENV !== "development") {
    if (err.name === "ValidationError") {
      statusCode = 400;
      const errors = Object.values(err.errors).map((val) => val.message);
      message = `Validation Error: ${errors.join(", ")}`;
    } else if (err.name === "CastError") {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
    } else {
      message = "Something went wrong";
    }
  }

  // Send the error response
  res.status(statusCode).json({ error: message });
};

export { errorHandler };
