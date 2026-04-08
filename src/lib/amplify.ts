import { Amplify } from 'aws-amplify'

export const isAuthBypassed = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

if (!isAuthBypassed) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      },
    },
  })
}
