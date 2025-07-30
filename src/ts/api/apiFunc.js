var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import dotenv from 'dotenv';
import axios from "axios";
const APIDOMAIN = (_b = (_a = dotenv.config().parsed) === null || _a === void 0 ? void 0 : _a.APIURL) !== null && _b !== void 0 ? _b : 'http://localhost:3000';
const brunoMarkdown_REST_API_URI = '/api/bruno';
const brunoMarkdown_PATH_API_URI = '/api/bruno-path?all=y';
export const getDirectoryInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(APIDOMAIN + brunoMarkdown_PATH_API_URI);
        return response.data;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
});
export const getMarkdownData = (path) => __awaiter(void 0, void 0, void 0, function* () {
    const reqURL = APIDOMAIN + brunoMarkdown_REST_API_URI + "/" + path;
    //console.log('reqURL : ' + reqURL);
    try {
        const response = yield axios.get(reqURL);
        return response.data;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
});
