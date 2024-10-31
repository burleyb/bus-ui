// Import necessary modules
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from '@aws-sdk/client-cognito-identity';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const LEOCognito = {
  credentials: {
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    needsRefresh: true,
  },
  pendingRequests: [],
  isFetchingToken: false,
};

LEOCognito.start = function (poolId, getToken, opts, callback) {

  console.log("[poolId]", poolId);

  const identityClient = new CognitoIdentityClient({ region: typeof poolId === 'string' ? poolId.split(/:/)[0] : poolId.Region });
  console.log("[identityClient]", identityClient);

  const getCognitoIdentityId = async () => {
    try {
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: poolId,
      });
  
      const identityResponse = await identityClient.send(getIdCommand);
      const identityId = identityResponse.IdentityId;
  
      console.log("Cognito Identity ID:", identityId);
      return {
        IdentityId: identityId
      };
    } catch (error) {
      console.error("Error getting Cognito Identity ID:", error);
    }
  };
  
  // Function to get temporary AWS credentials using the Cognito Identity ID
  const getTemporaryCredentials = async (identityId) => {
    try {
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
      });
  
      const credentialsResponse = await identityClient.send(getCredentialsCommand);
      const { Credentials } = credentialsResponse;
  
      console.log("Temporary AWS Credentials:", Credentials);
      return Credentials;
    } catch (error) {
      console.error("Error getting temporary credentials:", error);
    }
  };


  const loadTokens = async (callback) => {
    if (callback) LEOCognito.pendingRequests.push(callback);
    
    if (!LEOCognito.isFetchingToken) {
      LEOCognito.isFetchingToken = true;
      
      let credentials;
      if (getToken) {
        credentials = await getToken();
      } 
      if(!credentials) {
        credentials = await getCognitoIdentityId();
      }
      console.log("[credentials]", credentials);

      const command = new GetCredentialsForIdentityCommand({
        IdentityId: credentials?.IdentityId ?? "",
      });

      try {
        const response = await identityClient.send(command);
        console.log("[response]", response);
        
        LEOCognito.credentials = {
          accessKeyId: response.Credentials.AccessKeyId,
          secretAccessKey: response.Credentials.SecretKey,
          sessionToken: response.Credentials.SessionToken,
          needsRefresh: false,
        };

        LEOCognito.isFetchingToken = false;
        while (LEOCognito.pendingRequests.length) {
          const pendingRequest = LEOCognito.pendingRequests.shift();
          pendingRequest();
        }
      } catch(err) {
        console.log("[err]", err);
      }
      
    }
  };

  loadTokens();

  const addPendingRequest = (config) => {
    LEOCognito.pendingRequests.push(() => axios(config).catch(console.error));
    loadTokens(() => {
      LEOCognito.pendingRequests.forEach(request => request());
    });
  };

  axios.interceptors.request.use(async (config) => {
    if (config.url.startsWith(opts.apiUri)) {
      const datetime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[:\-]|\.\d{3}/g, '');
      
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-amz-date': datetime,
      };

      if (LEOCognito.credentials.needsRefresh) {
        addPendingRequest(config);
        return Promise.reject('Request added to queue, refreshing credentials');
      } else {
        const authorization = signRequest(opts.region, LEOCognito.credentials, config, datetime);
        headers.Authorization = authorization;
        headers['x-amz-security-token'] = LEOCognito.credentials.sessionToken;
      }

      config.headers = { ...config.headers, ...headers };
    }
    return config;
  });

  if (callback) callback(LEOCognito);
};

function signRequest(region, credentials, config, datetime) {
  const { accessKeyId, secretAccessKey } = credentials;
  const url = new URL(config.url);
  const canonicalRequest = buildCanonicalRequest(
    config.method.toUpperCase(),
    url.pathname,
    url.searchParams,
    config.headers,
    config.data || ''
  );

  const credentialScope = `${datetime.substr(0, 8)}/${region}/execute-api/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(secretAccessKey, datetime.substr(0, 8), region, 'execute-api');
  const signature = hmac(signingKey, stringToSign).toString(CryptoJS.enc.Hex);

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${Object.keys(config.headers).join(';')}, Signature=${signature}`;
}

function buildCanonicalRequest(method, path, queryParams, headers, payload) {
  return [
    method,
    encodeURI(path),
    queryParams.toString(),
    Object.entries(headers).map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`).sort().join(''),
    Object.keys(headers).map(k => k.toLowerCase()).sort().join(';'),
    hash(payload),
  ].join('\n');
}

function hash(value) {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

function hmac(key, value) {
  return CryptoJS.HmacSHA256(value, key);
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = hmac(CryptoJS.enc.Utf8.parse(`AWS4${key}`), dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

export default LEOCognito;
