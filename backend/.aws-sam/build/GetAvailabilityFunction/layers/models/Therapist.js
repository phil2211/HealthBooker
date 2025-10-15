"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Therapist = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const therapistSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    bio: {
        type: String,
        required: true,
        trim: true
    },
    photoUrl: {
        type: String,
        trim: true
    },
    weeklyAvailability: [{
            day: {
                type: Number,
                required: true,
                min: 0,
                max: 6
            },
            startTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            endTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            }
        }],
    blockedSlots: [{
            date: {
                type: String,
                required: true,
                match: /^\d{4}-\d{2}-\d{2}$/
            },
            startTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            },
            endTime: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            }
        }]
}, {
    timestamps: true
});
exports.Therapist = mongoose_1.default.model('Therapist', therapistSchema);
