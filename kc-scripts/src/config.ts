import _ from 'lodash';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/.env' });

export const WEBADE_USERNAME = process.env.WEBADE_USERNAME;
export const WEBADE_PASSWORD = process.env.WEBADE_PASSWORD;
export const WEBADE_URL = process.env.WEBADE_URL;

export const DEV_KEYCLOAK_URL = process.env.DEV_KEYCLOAK_URL || 'https://dev.loginproxy.gov.bc.ca';
export const DEV_KEYCLOAK_CLIENT_ID = process.env.DEV_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const DEV_KEYCLOAK_CLIENT_SECRET = process.env.DEV_KEYCLOAK_CLIENT_SECRET;
export const DEV_KEYCLOAK_USERNAME = process.env.DEV_KEYCLOAK_USERNAME;
export const DEV_KEYCLOAK_PASSWORD = process.env.DEV_KEYCLOAK_PASSWORD;

export const TEST_KEYCLOAK_URL = process.env.TEST_KEYCLOAK_URL || 'https://test.loginproxy.gov.bc.ca';
export const TEST_KEYCLOAK_CLIENT_ID = process.env.TEST_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const TEST_KEYCLOAK_CLIENT_SECRET = process.env.TEST_KEYCLOAK_CLIENT_SECRET;
export const TEST_KEYCLOAK_USERNAME = process.env.TEST_KEYCLOAK_USERNAME;
export const TEST_KEYCLOAK_PASSWORD = process.env.TEST_KEYCLOAK_PASSWORD;

export const PROD_KEYCLOAK_URL = process.env.PROD_KEYCLOAK_URL || 'https://loginproxy.gov.bc.ca';
export const PROD_KEYCLOAK_CLIENT_ID = process.env.PROD_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const PROD_KEYCLOAK_CLIENT_SECRET = process.env.PROD_KEYCLOAK_CLIENT_SECRET;
export const PROD_KEYCLOAK_USERNAME = process.env.PROD_KEYCLOAK_USERNAME;
export const PROD_KEYCLOAK_PASSWORD = process.env.PROD_KEYCLOAK_PASSWORD;

export const ALPHA_KEYCLOAK_URL = process.env.ALPHA_KEYCLOAK_URL || 'https://dev.loginproxy.gov.bc.ca';
export const ALPHA_KEYCLOAK_CLIENT_ID = process.env.ALPHA_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const ALPHA_KEYCLOAK_CLIENT_SECRET = process.env.ALPHA_KEYCLOAK_CLIENT_SECRET;
export const ALPHA_KEYCLOAK_USERNAME = process.env.ALPHA_KEYCLOAK_USERNAME;
export const ALPHA_KEYCLOAK_PASSWORD = process.env.ALPHA_KEYCLOAK_PASSWORD;

export const BETA_KEYCLOAK_URL = process.env.BETA_KEYCLOAK_URL || 'https://test.loginproxy.gov.bc.ca';
export const BETA_KEYCLOAK_CLIENT_ID = process.env.BETA_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const BETA_KEYCLOAK_CLIENT_SECRET = process.env.BETA_KEYCLOAK_CLIENT_SECRET;
export const BETA_KEYCLOAK_USERNAME = process.env.BETA_KEYCLOAK_USERNAME;
export const BETA_KEYCLOAK_PASSWORD = process.env.BETA_KEYCLOAK_PASSWORD;

export const GAMMA_KEYCLOAK_URL = process.env.GAMMA_KEYCLOAK_URL || 'https://loginproxy.gov.bc.ca';
export const GAMMA_KEYCLOAK_CLIENT_ID = process.env.GAMMA_KEYCLOAK_CLIENT_ID || 'admin-cli';
export const GAMMA_KEYCLOAK_CLIENT_SECRET = process.env.GAMMA_KEYCLOAK_CLIENT_SECRET;
export const GAMMA_KEYCLOAK_USERNAME = process.env.GAMMA_KEYCLOAK_USERNAME;
export const GAMMA_KEYCLOAK_PASSWORD = process.env.GAMMA_KEYCLOAK_PASSWORD;

export const BCEID_SERVICE_BASIC_AUTH = process.env.BCEID_SERVICE_BASIC_AUTH;
export const BCEID_REQUESTER_IDIR_GUID = process.env.BCEID_REQUESTER_IDIR_GUID;
export const BCEID_SERVICE_ID_DEV = process.env.BCEID_SERVICE_ID_DEV;
export const BCEID_SERVICE_ID_TEST = process.env.BCEID_SERVICE_ID_TEST;
export const BCEID_SERVICE_ID_PROD = process.env.BCEID_SERVICE_ID_PROD;
export const GITHUB_PAT = process.env.GITHUB_PAT;

export const IDIR_USERNAME = process.env.IDIR_USERNAME;
export const IDIR_PASSWORD = process.env.IDIR_PASSWORD;
export const DEV_BCEID_BASIC_USERNAME = process.env.DEV_BCEID_BASIC_USERNAME;
export const DEV_BCEID_BASIC_PASSWORD = process.env.DEV_BCEID_BASIC_PASSWORD;
export const TEST_BCEID_BASIC_USERNAME = process.env.TEST_BCEID_BASIC_USERNAME;
export const TEST_BCEID_BASIC_PASSWORD = process.env.TEST_BCEID_BASIC_PASSWORD;
export const PROD_BCEID_BASIC_USERNAME = process.env.PROD_BCEID_BASIC_USERNAME;
export const PROD_BCEID_BASIC_PASSWORD = process.env.PROD_BCEID_BASIC_PASSWORD;
export const DEV_BCEID_BUSINESS_USERNAME = process.env.DEV_BCEID_BUSINESS_USERNAME;
export const DEV_BCEID_BUSINESS_PASSWORD = process.env.DEV_BCEID_BUSINESS_PASSWORD;
export const TEST_BCEID_BUSINESS_USERNAME = process.env.TEST_BCEID_BUSINESS_USERNAME;
export const TEST_BCEID_BUSINESS_PASSWORD = process.env.TEST_BCEID_BUSINESS_PASSWORD;
export const PROD_BCEID_BUSINESS_USERNAME = process.env.PROD_BCEID_BUSINESS_USERNAME;
export const PROD_BCEID_BUSINESS_PASSWORD = process.env.PROD_BCEID_BUSINESS_PASSWORD;

export const credentials = {
  IDIR_USERNAME,
  IDIR_PASSWORD,
  DEV_BCEID_BASIC_USERNAME,
  DEV_BCEID_BASIC_PASSWORD,
  TEST_BCEID_BASIC_USERNAME,
  TEST_BCEID_BASIC_PASSWORD,
  PROD_BCEID_BASIC_USERNAME,
  PROD_BCEID_BASIC_PASSWORD,
  DEV_BCEID_BUSINESS_USERNAME,
  DEV_BCEID_BUSINESS_PASSWORD,
  TEST_BCEID_BUSINESS_USERNAME,
  TEST_BCEID_BUSINESS_PASSWORD,
  PROD_BCEID_BUSINESS_USERNAME,
  PROD_BCEID_BUSINESS_PASSWORD,
};
