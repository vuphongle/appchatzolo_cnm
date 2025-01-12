import { REGION, USER_POOL_ID, USER_POOL_WEB_CLIENT_ID, DOMAIN } from '@env';
console.log('REGION:', REGION);
console.log('USER_POOL_ID:', USER_POOL_ID);
console.log('USER_POOL_WEB_CLIENT_ID:', USER_POOL_WEB_CLIENT_ID);
console.log('DOMAIN:', DOMAIN);

const awsConfig = {
    Auth: {
        region: REGION,
        userPoolId: USER_POOL_ID,
        userPoolWebClientId: USER_POOL_WEB_CLIENT_ID,
        mandatorySignIn: false,
        authenticationFlowType: 'USER_SRP_AUTH',
        oauth: {
            domain: DOMAIN,
            scope: ['phone', 'email', 'openid', 'profile'],
            redirectSignIn: 'myapp://callback',
            redirectSignOut: 'myapp://signout',
            responseType: 'code'
        },
        mfaConfiguration: 'OPTIONAL',
    }
};

export default awsConfig;
