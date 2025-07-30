import dotenv from 'dotenv';
import axios, {AxiosResponse} from "axios";

export type DirectoryInfo = {
    isBru : boolean;
    directoryPath : string;
    directoryName : string;
    subDirectoryList : DirectoryInfo[];
}

export type DirectoryInfoResponse = {
    httpStatus : string;
    message : string;
    data : DirectoryInfo[];
}

export type BrunoDataResponse = {
    httpStatus : string;
    message : string;
    data : string;
}

const APIDOMAIN = dotenv.config().parsed?.APIURL ?? 'http://localhost:3000';
const brunoMarkdown_REST_API_URI = '/api/bruno';
const brunoMarkdown_PATH_API_URI = '/api/bruno-path?all=y';

export const getDirectoryInfo = async () : Promise<DirectoryInfoResponse> => {
    try {
        const response : AxiosResponse<DirectoryInfoResponse> = await axios.get(APIDOMAIN + brunoMarkdown_PATH_API_URI);
        return response.data;
    }catch(e){
        console.error(e);
        throw e;
    }   
}

export const getMarkdownData = async (path : string) : Promise<BrunoDataResponse> => {
    const reqURL = APIDOMAIN + brunoMarkdown_REST_API_URI + "/" + path;
    //console.log('reqURL : ' + reqURL);
    try {
        const response : AxiosResponse<BrunoDataResponse> = await axios.get(reqURL);
        return response.data;
    }catch(e){
        console.error(e);
        throw e;
    }
}