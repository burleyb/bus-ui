"use client";

import { 
  AuthenticationDetails, 
  CognitoUser, 
  CognitoUserPool,
  CognitoUserSession,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

// Configuration for Cognito
const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || ''
};

// Create a user pool instance - only on client side
let userPool: CognitoUserPool | null = null;

// Initialize the user pool on the client side only
if (typeof window !== 'undefined') {
  userPool = new CognitoUserPool(poolData);
}

/**
 * Class to handle authentication with AWS Cognito
 */
class CognitoAuth {
  // Get the current authenticated user
  getCurrentUser() {
    if (!userPool) return null;
    return userPool.getCurrentUser();
  }

  // Get session for the current user
  async getSession(): Promise<CognitoUserSession | null> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      return null;
    }

    return new Promise((resolve, reject) => {
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(session);
      });
    });
  }

  // Sign in user
  async signIn(username: string, password: string): Promise<any> {
    if (!userPool) {
      throw new Error('Cognito user pool not initialized');
    }

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    const userData = {
      Username: username,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Handle new password required challenge
          resolve({
            cognitoUser,
            userAttributes,
            requiredAttributes,
            challengeName: 'NEW_PASSWORD_REQUIRED'
          });
        }
      });
    });
  }

  // Complete new password challenge
  async completeNewPassword(
    user: CognitoUser,
    newPassword: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      user.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: (result) => {
            resolve(result);
          },
          onFailure: (err) => {
            reject(err);
          }
        }
      );
    });
  }

  // Sign out user
  signOut() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
  }

  // Get the current authenticated user's attributes
  async getUserAttributes(): Promise<Record<string, string>> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      return {};
    }

    return new Promise((resolve, reject) => {
      currentUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }
        
        const userAttributes: Record<string, string> = {};
        if (attributes) {
          attributes.forEach(attribute => {
            userAttributes[attribute.getName()] = attribute.getValue();
          });
        }
        
        resolve(userAttributes);
      });
    });
  }

  // Get authentication tokens
  async getAuthTokens() {
    const session = await this.getSession();
    
    if (!session) {
      return null;
    }
    
    return {
      idToken: session.getIdToken().getJwtToken(),
      accessToken: session.getAccessToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken()
    };
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false; // Server-side rendering, default to not authenticated
    }
    
    try {
      const session = await this.getSession();
      return !!session && session.isValid();
    } catch (error) {
      return false;
    }
  }
}

// Export a singleton instance
const cognitoAuth = new CognitoAuth();
export default cognitoAuth; 