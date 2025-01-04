const awsConfig = {
    Auth: {
        region: process.env.region,
        userPoolId: process.env.userPoolId,
        userPoolWebClientId: process.env.userPoolWebClientId,
        mandatorySignIn: false,
        authenticationFlowType: 'USER_SRP_AUTH',
        oauth: {
            domain: process.env.domain,
            scope: ['phone', 'email', 'openid', 'profile'],
            redirectSignIn: 'myapp://callback',
            redirectSignOut: 'myapp://signout',
            responseType: 'code'
        },
        mfaConfiguration: 'OPTIONAL',
    }
};

export default awsConfig;
