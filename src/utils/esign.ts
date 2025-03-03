import { fetch } from "@tauri-apps/plugin-http";
import { Buffer } from "buffer";
import { data } from "framer-motion/client";

async function doCommHttp(
  url: string,
  reqType: string,
  paramStr: string,
  httpHeader: Record<string, any>,
  debug: boolean
) {
  const host = "https://openapi.esign.cn";
  const headers = httpHeader;
  let requestBody = null;

  // 根据请求类型设置请求方法和请求体
  switch (reqType) {
    case "GET":
      break;
    case "POST":
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(paramStr);
      break;
    case "PUT":
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(paramStr);
      break;
    case "DELETE":
      break;
    default:
      throw new Error("Unsupported request type");
  }

  const options = {
    method: reqType,
    headers: headers,
    body: requestBody,
  };

  let response;
  try {
    response = await fetch(`${host}${url}`, options);
    const responseData = await response.json(); // 假设响应内容是JSON格式
    if (debug) {
      console.log("Request==:", `${host}${url}`);
      console.log("Headers==:", headers);
      console.log("Response==:", responseData);
    }
    return responseData;
  } catch (error) {
    console.error("HTTP request failed:", error);
    throw error;
  }
}

async function signAndBuildSignAndJsonHeader2(
  projectId: string,
  secret: string,
  paramStr: string,
  httpMethod: string,
  url: string,
  debug: boolean
) {
  console.log("projectId:", projectId, "secret:", secret);

  let contentMD5 = "";
  httpMethod = httpMethod.toUpperCase();

  if ("GET" === httpMethod || "DELETE" === httpMethod) {
    paramStr = "";
    contentMD5 = "";
  } else if ("PUT" === httpMethod || "POST" === httpMethod) {
    // 对body体做md5摘要
    contentMD5 = (crypto as any)
      .createHash("md5")
      .update(paramStr)
      .digest("hex");
  } else {
    throw new Error(`不支持的请求方法${httpMethod}`);
  }

  let esignHeaderMap: Record<string, any> = buildSignAndJsonHeader(
    projectId,
    contentMD5,
    "*/*",
    "application/json; charset=UTF-8",
    "Signature"
  );

  // 排序
  url = sortApiUrl(url);

  // 传入生成的bodyMd5,加上其他请求头部信息拼接成字符串
  let message = appendSignDataString(
    httpMethod,
    esignHeaderMap["Content-MD5"],
    esignHeaderMap["Accept"],
    esignHeaderMap["Content-Type"],
    esignHeaderMap["Headers"],
    esignHeaderMap["Date"],
    url
  );

  // 整体做sha256签名
  let reqSignature = await doSignatureBase64(message, secret);

  // 请求头添加签名值
  esignHeaderMap["X-Tsign-Open-Ca-Signature"] = reqSignature;

  if (debug) {
    console.log("----------------------------start------------------------");
    console.log("待计算body值:", paramStr + "\n");
    console.log("MD5值:", contentMD5 + "\n");
    console.log("待签名字符串:", message + "\n");
    console.log("签名值:", reqSignature + "\n");
  }

  return esignHeaderMap;
}

function buildSignAndJsonHeader(
  projectId: string,
  contentMD5: string,
  accept: string,
  contentType: string,
  authMode: string
) {
  const header = {
    "X-Tsign-Open-App-Id": projectId,
    "X-Tsign-Open-Version-Sdk": getSdkVersion(),
    "X-Tsign-Open-Ca-Timestamp": getTimestamp(),
    Accept: accept,
    "Content-MD5": contentMD5,
    "Content-Type": contentType,
    "X-Tsign-Open-Auth-Mode": authMode,
  };
  return header;
}

function sortApiUrl(apiUrl: string) {
  if (!apiUrl.includes("?")) {
    return apiUrl;
  }

  const queryIndex = apiUrl.indexOf("?");
  const apiUrlPath = apiUrl.substring(0, queryIndex + 1);
  const apiUrlQuery = apiUrl.substring(queryIndex + 1);

  if (!apiUrlQuery) {
    return apiUrl.substring(0, apiUrl.length - 1);
  }

  // 请求URL中Query参数转成Map
  const queryParamsMap: Record<string, any> = {};
  const params = apiUrlQuery.split("&");
  for (const str of params) {
    const index = str.indexOf("=");
    const key = str.substring(0, index);
    const value = str.substring(index + 1);
    if (queryParamsMap.hasOwnProperty(key)) {
      throw new Error(`请求URL中的Query参数的${key}重复`);
    }
    queryParamsMap[key] = value;
  }

  // 按照字段名的ASCII码从小到大排序（字典排序）
  const queryMapKeys = Object.keys(queryParamsMap).sort((a, b) => {
    if (a.toLowerCase() === b.toLowerCase()) {
      return a.localeCompare(b);
    }
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  let queryString = "";
  // 构造Query参数键值对值对的格式
  for (const key of queryMapKeys) {
    const value = queryParamsMap[key];
    queryString += `${key}=${value}&`;
  }
  if (queryString.length > 0) {
    queryString = queryString.slice(0, -1);
  }

  // Query参数排序后的接口请求地址
  const sortApiUrl = `${apiUrlPath}${queryString}`;
  return sortApiUrl;
}

function appendSignDataString(
  httpMethod: string,
  contentMd5: string,
  accept: string,
  contentType: string,
  headers: Record<string, any>,
  date: string,
  url: string
) {
  // 初始化字符串模板
  let sb =
    httpMethod + "\n" + accept + "\n" + contentMd5 + "\n" + contentType + "\n";

  // 检查日期是否为空或未定义，然后决定是否添加到字符串模板中
  if (date === "" || date === null || date === undefined) {
    sb += "\n";
  } else {
    sb += date + "\n";
  }

  // 检查headers是否为空或未定义，然后决定如何添加到字符串模板中
  if (!headers || headers === null || headers === undefined) {
    sb += url;
  } else {
    sb += headers + "\n" + url;
  }

  return sb;
}

async function doSignatureBase64(message: string, secret: string) {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

    return Buffer.from(new Uint8Array(signature)).toString("base64");
  } catch (error) {
    console.error("签名过程中发生错误:", error);
    throw error;
  }
}

function getTimestamp() {
  // 实现获取时间戳的逻辑
  return Date.now().toString();
}

function getSdkVersion() {
  // 实现获取SDK版本的逻辑
  return "Esign-Sdk-Core1.0";
}

async function loadApolloConfig(server: string, appId: string) {
  return await fetch(
    `${server}/configfiles/json/${appId}/default/application.properties`,
    { connectTimeout: 2000 }
  )
    .then(async (res) => {
      if (res.status == 200) {
        const json = await res.json();
        return { data: json, status: res.status, message: "" };
      } else {
        return { status: res.status, message: res.statusText };
      }
    })
    .catch((err) => Promise.resolve({ status: 500, data: "", message: err }));
}

class Esign {
  config: Record<string, string> = {};
  debug: boolean = true;

  async loadConfig(server: string, appId: string) {
    return loadApolloConfig(server, appId).then(({ status, data, message }) => {
      if (status == 200) {
        this.config = data;
      } else {
        return Promise.reject({ status: status, error: message });
      }
    });
  }

  async getComponentList(paramStr: string, httpMethod: string) {
    const url =
      "/v3/doc-templates/" + this.config["esign.contract.template.id"];
    return this.sendRequest(url, paramStr, httpMethod);
  }

  async sendRequest(url: string, paramStr: string, httpMethod: string) {
    const httpHeader = await signAndBuildSignAndJsonHeader2(
      this.config["esign.project.id"],
      this.config["esign.project.secret"],
      paramStr,
      httpMethod,
      url,
      this.debug
    );

    return doCommHttp(url, httpMethod, paramStr, httpHeader, this.debug);
  }
}
export default new Esign();
