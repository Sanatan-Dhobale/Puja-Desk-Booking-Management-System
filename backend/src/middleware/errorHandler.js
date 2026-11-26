function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let status = error.status || 500;
  let message = error.message;

  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors).map((item) => item.message).join('; ');
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid value for ' + error.path;
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(error);
    message = 'Internal server error';
  }

  res.status(status).json({ success: false, message, data: null });
}

export default errorHandler;
