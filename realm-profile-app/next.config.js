/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    sso_url: process.env.SSO_URL || 'http://localhost:8080',
    sso_client_id: process.env.SSO_CLIENT_ID || '',
    sso_client_secret: process.env.SSO_CLIENT_SECRET || '',
    sso_redirect_uri: process.env.SSO_REDIRECT_URI || 'http://localhost:3000',
    sso_logout_redirect_uri: process.env.SSO_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
    sso_authorization_response_type: process.env.SSO_AUTHORIZATION_RESPONSE_TYPE || 'code',
    sso_authorization_scope: process.env.SSO_AUTHORIZATION_SCOPE || 'openid',
    sso_token_grant_type: process.env.SSO_TOKEN_GRANT_TYPE || 'authorization_code',
    jwt_secret: process.env.JWT_SECRET || 'verysecuresecret',
    jwt_token_expiry: process.env.JWT_TOKEN_EXPIRY || '1h',
  },
  publicRuntimeConfig: {},
};
