// TODO: Configurar con credenciales reales de AWS Amplify
// Esta es una configuración temporal para desarrollo

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // TODO: Reemplazar con userPoolId real
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // TODO: Reemplazar con clientId real
      identityPoolId: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // TODO: Reemplazar con identityPoolId real
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'your-bucket-name', // TODO: Reemplazar con bucket real
      region: 'us-east-1', // TODO: Ajustar región
    },
  },
};

// Configuración para Liveness Detection
export const livenessConfig = {
  // TODO: Configurar con credenciales reales
  region: 'us-east-1',
  // Aquí irán las configuraciones específicas de Rekognition cuando estén disponibles
};

export default amplifyConfig;
