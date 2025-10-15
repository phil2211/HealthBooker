"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const layers_1 = require("./layers");
const apiHelpers_1 = require("./layers/utils/apiHelpers");
const mongoose_1 = __importDefault(require("mongoose"));
const handler = async (event) => {
    // Handle CORS
    const corsResponse = (0, apiHelpers_1.handleCors)(event);
    if (corsResponse)
        return corsResponse;
    try {
        await (0, layers_1.connectToDatabase)();
        const therapistId = (0, apiHelpers_1.getPathParameter)(event, 'id');
        if (!therapistId) {
            return (0, apiHelpers_1.createErrorResponse)(400, 'Therapist ID is required');
        }
        // Validate ObjectId format
        if (!mongoose_1.default.Types.ObjectId.isValid(therapistId)) {
            return (0, apiHelpers_1.createErrorResponse)(404, 'Therapist not found');
        }
        const therapist = await layers_1.Therapist.findById(therapistId);
        if (!therapist) {
            return (0, apiHelpers_1.createErrorResponse)(404, 'Therapist not found');
        }
        return (0, apiHelpers_1.createResponse)(200, {
            therapist: {
                id: therapist._id,
                name: therapist.name,
                specialization: therapist.specialization,
                bio: therapist.bio,
                photoUrl: therapist.photoUrl
            }
        });
    }
    catch (error) {
        console.error('Get therapist profile error:', error);
        return (0, apiHelpers_1.createErrorResponse)(500, 'Internal server error');
    }
};
exports.handler = handler;
