/**
 * Standardized API response format helpers.
 */
export const ApiResponse = {
  success: (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data !== null && { data }),
    });
  },

  created: (res, data = null, message = 'Resource created successfully') => {
    return res.status(201).json({
      success: true,
      message,
      ...(data !== null && { data }),
    });
  },

  error: (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  },
};
