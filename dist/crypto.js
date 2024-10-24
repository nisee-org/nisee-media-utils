"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hkdf = hkdf;
const futoin_hkdf_1 = __importDefault(require("futoin-hkdf"));
function hkdf(buffer, expandedLength, info) {
    return (0, futoin_hkdf_1.default)(!Buffer.isBuffer(buffer) ? Buffer.from(buffer) : buffer, expandedLength, info);
}
