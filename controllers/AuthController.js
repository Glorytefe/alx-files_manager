import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

class AuthController {
  /**
   * sign-in the user by generating a new authentication token
   * with the header Authorization and the technique of the Basic auth
   * (Base64 of the <email>:<password>), find the user associated to this email
   * and with this password (reminder: we are storing the SHA1 of the password)
   * If no user has been found, return an error Unauthorized with a status code 401
   * Else:
   * Generate a random string (using uuidv4) as token
   * Create a key: auth_<token>
   * Use this key for Redis (by using the redisClient create previously)
   * the user ID for 24 hours
   * Returns { "token": "155342df-2399-41da-9e8c-458b6ac52a0c" }
   * with a status code 200
   */
  static async getConnect(request, response) {
    const authorization = request.header('Authorization') || '';

    const credentials = authorization.split(' ')[1];

    if (!credentials) { return response.status(401).send({ error: 'Unauthorized' }); }

    const decodedCredentials = Buffer.from(credentials, 'base64').toString(
      'utf-8',
    );

    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) { return response.status(401).send({ error: 'Unauthorized' }); }

    const hashedPassword = sha1(password);

    const user = await userUtils.getUser({
      email,
      password: hashedPassword,
    });

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const expiryTimeInHrs = 24;

    await redisClient.set(key, user._id.toString(), expiryTimeInHrs * 3600);

    return response.status(200).send({ token });
  }

  /**
   * logs out the user based on the token
   *
   * Retrieve the user based on the token:
   * If not found, returns an error - unauthorized with a 401 status code
   * Else, delete the token in Redis
   * and return 204 status code
   */
  static async getDisconnect(request, response) {
    const { userId, key } = await userUtils.getUserIdAndKey(request);

    if (!userId) return response.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(key);

    return response.status(204).send();
  }
}

export default AuthController;
