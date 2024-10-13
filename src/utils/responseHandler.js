const responseHandler = async (res, statusCode, message, data = null) => {
    const response = {
        status: statusCode,
        message
    };

    if (data !== null) {
        response.data = data;
    }

    // Return the response as a JSON object
    return res.status(statusCode).json(response);
};

module.exports = responseHandler;
