const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error('[Error Logger]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method
  });

  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum allowed size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // Custom multer file filter rejection
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // MySQL Duplicate Entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique information already exists (e.g., email or booked slot).'
    });
  }

  // MySQL Foreign Key Constraint Error
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity not found. Please verify the IDs provided.'
    });
  }

  // JSON Syntax Error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload provided in request body.'
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

// 404 Route Not Found Handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
