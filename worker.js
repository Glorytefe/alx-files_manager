import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import fileUtils from './utils/file';
import userUtils from './utils/user';
import Utils from "./utils";

/**
 * By using the module Bull, create a queue fileQueue
 * Process this queue:
 * If fileId is not present in the job, raise an error Missing fileId
 * If userId is not present in the job, raise an error Missing userId
 * If no document is found in DB based on the fileId and userId,
 *  raise an error File not found
 * By using the module image-thumbnail, 
 * generate 3 thumbnails with width = 500, 250 and 100 
 * store each result on the same location of the original file
 * by appending _<width size>
 */

const imageThumbnail = require('image-thumbnail');

const userQueue = new Queue('userQueue');
const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!fileId) {
    console.log('Missing fileId');
    throw new Error('Missing fileId');
  }

  if (!Utils.isValidId(fileId) || !Utils.isValidId(userId)) throw new Error('File not found');

  const file = await fileUtils.getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  widths.forEach(async (width) => {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
    } catch (err) {
      console.error(err.message);
    }
  });
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!Utils.isValidId(userId)) throw new Error('User not found');

  const user = await userUtils.getUser({
    _id: ObjectId(userId),
  });

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});
