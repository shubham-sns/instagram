import { firebaseApp, FieldValue } from 'lib/firebase';

/** Initializing firestore database */
const database = firebaseApp.firestore();

/**
 * Function used to check if a username already exists in database. Returns `1 | 0`
 *
 * @param {string} username Username to be checked
 * @return {Promise<number>} A promise of type number.
 */
async function doesUserExist(username) {
  const { docs } = await database
    .collection('users')
    .where('username', '==', username)
    .get();

  return docs.map((doc) => doc.data()).length;
}

/**
 * Function used to create a new user in the firestore
 *
 * @param {object} userObject The user data to be added to the collection
 *
 * @return {Promise<void>} A promise of type void.
 */
async function createFirestoreUser(userObject) {
  return database.collection('users').add(userObject);
}

/**
 * Function used to query data for a specific user by it's user `ID`
 *
 * @param {string} userId The user id to be queried by
 * @return {Promise<{}>} A promise of type object.
 */
async function getUserDataByUserId(userId) {
  const { docs } = await database
    .collection('users')
    .where('userId', '==', userId)
    .get();

  const [user] = docs.map((doc) => ({
    ...doc.data(),
    docId: doc.id,
  }));

  return user;
}

/**
 * Function used to get suggested user profiles for a specific user, queried by `userId`. It limits the queried results to `10` by default
 *
 * @param {string} userId The user id to be queried by
 * @param {string[]} userFollowing An array containing all the following users of the current user
 * @param {number} [limitQuery=10] Limit the suggested profiles query.
 *
 * @return {Promise<Array<{}>>} A promise of type object array.
 */
async function getSuggestedProfilesByUserId(
  userId,
  userFollowing,
  limitQuery = 10,
) {
  const { docs } = await database.collection('users').limit(limitQuery).get();

  return docs
    .map((doc) => ({ ...doc.data(), docId: doc.id }))
    .filter(
      (profile) =>
        profile.userId !== userId && !userFollowing.includes(profile.userId),
    );
}

/**
 * Function used to update the user `following field`
 *
 * @param {string} suggestedUserId The user id of the suggested profile
 * @param {string} userId The user id of the current logged in user
 * @param {boolean} [userFollowingStatus=false] The following status of the suggested profile
 *
 * @return {Promise<void>} A promise of type void.
 */
async function updateUserFollowingField(
  suggestedUserId,
  userId,
  userFollowingStatus = false,
) {
  const { docs } = await database
    .collection('users')
    .where('userId', '==', userId)
    .get();

  docs.map((doc) =>
    doc.ref.update({
      following: userFollowingStatus
        ? FieldValue.arrayRemove(suggestedUserId)
        : FieldValue.arrayUnion(suggestedUserId),
    }),
  );
}

/**
 * Function used to update the user `followers field`
 *
 * @param {string} suggestedUserDocId The user document id of the suggested profile
 * @param {string} userId The user id of the current logged in user
 * @param {boolean} [userFollowingStatus=false] The following status of the suggested profile
 *
 * @return {Promise<void>} A promise of type void.
 */
async function updateUserFollowersField(
  suggestedUserDocId,
  userId,
  userFollowingStatus = false,
) {
  return database
    .collection('users')
    .doc(suggestedUserDocId)
    .update({
      followers: userFollowingStatus
        ? FieldValue.arrayRemove(userId)
        : FieldValue.arrayUnion(userId),
    });
}

/**
 * Function used to get all the photos of a user that is followed by current logged in user by it's `ID`
 *
 * @param {string} userId The user id of the current logged in user
 * @param {string[]} userFollowing An array containing all the following users of the current user
 *
 * @return {Promise<Array<{}>>} A promise of type object array.
 */
async function getFollowingUserPhotosByUserId(userId, userFollowing) {
  const { docs } = await database
    .collection('photos')
    .where('userId', 'in', userFollowing)
    .get();

  const userFollowedPhotos = docs.map((doc) => ({
    ...doc.data(),
    docId: doc.id,
  }));

  const photosWithUserData = await Promise.all(
    userFollowedPhotos.map(async (photo) => {
      let userLikedPhoto = false;
      let userSavedPhoto = false;

      if (photo.likes.includes(userId)) {
        userLikedPhoto = true;
      }

      if (photo.saved.includes(userId)) {
        userSavedPhoto = true;
      }

      const {
        username,
        photoURL,
        verifiedUser,
        docId,
      } = await getUserDataByUserId(photo.userId);

      const user = { username, photoURL, verifiedUser, docId };

      return { user, ...photo, userLikedPhoto, userSavedPhoto };
    }),
  );

  return photosWithUserData;
}

/**
 * Function used to get user photos by it's user `ID`. It limits the queried results to `25` by default and sorts it by newest first
 *
 * @param {string} userId The user id to be queried by
 * @param {number} [limitQuery=25] Limit the user photos query.
 *
 * @return {Promise<Array<{}>>} A promise of type object array.
 */
async function getUserPhotosByUserId(userId, limitQuery = 25) {
  const { docs } = await database
    .collection('photos')
    .where('userId', '==', userId)
    .limit(limitQuery)
    .get();

  return docs
    .map((doc) => ({ ...doc.data(), docId: doc.id }))
    .sort((a, b) => b.dateCreated - a.dateCreated);
}

/**
 * Function used to update the post `likes field`
 *
 * @param {string} postDocId The post document id
 * @param {string} userId The user id of the current logged in user
 * @param {boolean} [userLikedStatus=false] The liked status of the post
 *
 * @return {Promise<void>} A promise of type void.
 */
async function updatePostLikesField(
  postDocId,
  userId,
  userLikedStatus = false,
) {
  return database
    .collection('photos')
    .doc(postDocId)
    .update({
      likes: userLikedStatus
        ? FieldValue.arrayRemove(userId)
        : FieldValue.arrayUnion(userId),
    });
}

/**
 * Function used to update the post `saved field`
 *
 * @param {string} userDocId The user document id of the post user owner
 * @param {string} userId The user id of the current logged in user
 * @param {boolean} [userSavedStatus=false] The saved status of the post
 *
 * @return {Promise<void>} A promise of type void.
 */
async function updatePostSavedField(
  userDocId,
  userId,
  userSavedStatus = false,
) {
  return database
    .collection('photos')
    .doc(userDocId)
    .update({
      saved: userSavedStatus
        ? FieldValue.arrayRemove(userId)
        : FieldValue.arrayUnion(userId),
    });
}

/**
 * Function used to update the user `savedPosts field`
 *
 * @param {string} userDocId The user document id
 * @param {string} postId The post id of post to be added to saved
 * @param {boolean} [userSavedStatus=false] The saved status of the current post
 *
 * @return {Promise<void>} A promise of type void.
 */
async function updateUserSavedPostsField(
  userDocId,
  postId,
  userSavedStatus = false,
) {
  return database
    .collection('users')
    .doc(userDocId)
    .update({
      savedPosts: userSavedStatus
        ? FieldValue.arrayRemove(postId)
        : FieldValue.arrayUnion(postId),
    });
}

/**
 * Function used to add a comment to a given post
 *
 * @param {string} postDocId The post document id to be updated
 * @param {string} newPostComment The comment to be added
 *
 * @return {Promise<void>} A promise of type void.
 */
async function addPostComments(postDocId, newPostComment) {
  return database
    .collection('photos')
    .doc(postDocId)
    .update({
      comments: FieldValue.arrayUnion(newPostComment),
    });
}

export {
  doesUserExist,
  createFirestoreUser,
  getUserDataByUserId,
  getSuggestedProfilesByUserId,
  updateUserFollowersField,
  updateUserFollowingField,
  getUserPhotosByUserId,
  getFollowingUserPhotosByUserId,
  updatePostLikesField,
  updateUserSavedPostsField,
  updatePostSavedField,
  addPostComments,
};
