"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCors = exports.getQueryParameter = exports.getPathParameter = exports.parseBody = exports.createErrorResponse = exports.createResponse = void 0;
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        ...headers
    },
    body: JSON.stringify(body)
});
exports.createResponse = createResponse;
const createErrorResponse = (statusCode, message) => (0, exports.createResponse)(statusCode, { error: message });
exports.createErrorResponse = createErrorResponse;
const parseBody = (event) => {
    try {
        return event.body ? JSON.parse(event.body) : {};
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
};
exports.parseBody = parseBody;
const getPathParameter = (event, param) => {
    return event.pathParameters?.[param];
};
exports.getPathParameter = getPathParameter;
const getQueryParameter = (event, param) => {
    return event.queryStringParameters?.[param];
};
exports.getQueryParameter = getQueryParameter;
const handleCors = (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return (0, exports.createResponse)(200, {});
    }
    return null;
};
exports.handleCors = handleCors;
