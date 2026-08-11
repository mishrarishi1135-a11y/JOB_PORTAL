const { createClerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const isMockAuth = process.env.MOCK_AUTH === 'true' || !clerkSecretKey || clerkSecretKey.includes('xxxxxx');

const clerkClient = (clerkSecretKey && !isMockAuth) ? createClerkClient({ secretKey: clerkSecretKey }) : null;

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    
    if (isMockAuth) {
      let mockRole = 'seeker';
      if (token && token.startsWith('mock_token_abc:')) {
        mockRole = token.split(':')[1] || 'seeker';
      }
      
      let user = await User.findOne({ clerkId: 'mock_user_123' });
      if (!user) {
        user = await User.create({
          clerkId: 'mock_user_123',
          email: 'mock.user@example.com',
          name: 'Mock User',
          role: mockRole,
        });
      } else if (user.role !== mockRole) {
        user.role = mockRole;
        await user.save();
      }
      req.user = user;
      return next();
    }

    // Verify the JWT token using Clerk's SDK
    let decoded;
    try {
      if (!clerkClient) {
        throw new Error('Clerk client not initialized.');
      }
      decoded = await clerkClient.verifyToken(token);
    } catch (err) {
      console.error('Clerk Token Verification Error:', err.message);
      return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }

    const clerkId = decoded.sub;

    // Retrieve user from MongoDB or create/sync if they don't exist
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Fetch user details from Clerk using the Clerk SDK
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        
        // Find email address
        const email = clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0 
          ? clerkUser.emailAddresses[0].emailAddress 
          : '';
        
        // Find name
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Job Seeker';

        // Check if there is an existing user with this email (e.g. created through other means)
        user = await User.findOne({ email });
        if (user) {
          // Update existing user with Clerk ID
          user.clerkId = clerkId;
          await user.save();
        } else {
          // Create new user in our DB
          user = await User.create({
            clerkId,
            email,
            name,
            role: 'seeker', // Default role
          });
        }
      } catch (err) {
        console.error('Error fetching/syncing user details from Clerk:', err.message);
        return res.status(500).json({ message: 'Failed to sync user authentication details' });
      }
    }

    // Attach user information to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of these roles: ${rolesArray.join(', ')}` });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
