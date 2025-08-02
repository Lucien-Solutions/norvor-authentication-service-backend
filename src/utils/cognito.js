const { CognitoIdentityProviderClient, 
        RespondToAuthChallengeCommand,
        AdminCreateUserCommand,
        AdminSetUserPasswordCommand,
        AdminEnableUserCommand,
        AdminRespondToAuthChallengeCommand,
        InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
        const crypto = require('crypto');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  }
});

// Create user in Cognito after email verification
async function createCognitoUser(email, password) {
  try {
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });

    const createResult = await cognitoClient.send(createUserCommand);
    const cognitoSub = createResult.User.Attributes.find(attr => attr.Name === 'sub').Value;

    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);

    const enableCommand = new AdminEnableUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email
    });

    await cognitoClient.send(enableCommand);

    return cognitoSub;
  } catch (error) {
    console.error('Cognito user creation failed:', error);
    throw error;
  }
}


function calculateSecretHash(username) {
  return crypto
    .createHmac('SHA256', process.env.COGNITO_CLIENT_SECRET)
    .update(username + process.env.COGNITO_CLIENT_ID)
    .digest('base64');
}

async function loginWithMFA(email, password) {
  try {
    const secretHash = calculateSecretHash(email);
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    };

    const authResponse = await cognitoClient.send(new InitiateAuthCommand(authParams));
    // Handle all possible MFA challenges
    if (authResponse.ChallengeName) {
      return {
        challenge: authResponse.ChallengeName,
        session: authResponse.Session,
        requiresMFA: true,
        challengeParameters: authResponse.ChallengeParameters
      };
    }

    return {
      tokens: authResponse.AuthenticationResult,
      requiresMFA: false
    };
  } catch (error) {
    console.error('Cognito login error:', error);
    throw error;
  }
}
// Verify MFA code
async function verifyMFACode(email, session, code, challengeName) {
  const challengeResponses = {
    USERNAME: email,
    [challengeName === 'SMS_MFA' ? 'SMS_MFA_CODE' : 
     challengeName === 'SOFTWARE_TOKEN_MFA' ? 'SOFTWARE_TOKEN_MFA_CODE' :
     challengeName === 'CUSTOM_CHALLENGE' ? 'ANSWER' :
     'EMAIL_OTP_CODE']: code
  };

  const secretHash = calculateSecretHash(email);
  if (secretHash) {
    challengeResponses.SECRET_HASH = secretHash;
  }

  const response = await cognitoClient.send(
    new RespondToAuthChallengeCommand({
      ChallengeName: challengeName,
      ClientId: process.env.COGNITO_CLIENT_ID,
      Session: session,
      ChallengeResponses: challengeResponses
    })
  );

  if (!response.AuthenticationResult) {
    throw new Error("MFA verification failed");
  }

  return response.AuthenticationResult;
}


module.exports = { createCognitoUser, loginWithMFA, verifyMFACode };