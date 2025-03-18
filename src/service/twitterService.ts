import axios from "axios";

const BASE_URL = "https://api.twitterapi.io";
const API_KEY = process.env.TWITTER_API_KEY;

const options = {
  method: "GET",
  headers: { "X-API-Key": API_KEY },
};

/**
 * Verifies if the replies for a given tweet contain a reply authored by the specified twitterUserName.
 * It will keep fetching subsequent pages if available.
 *
 * @param tweetId - The tweet ID for which to fetch replies.
 * @param twitterUserName - The username to look for in the replies.
 * @returns true if a reply from twitterUserName is found; otherwise, false.
 */
export async function verifyReplies(
  tweetId: string,
  twitterUserName: string,
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/replies?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, options);
      const data = response.data;

      if (Array.isArray(data.tweets)) {
        verified = data.tweets.some(
          (tweets: any) =>
            tweets.author &&
            tweets.author.userName &&
            tweets.author.userName.toLowerCase() ===
              twitterUserName.toLowerCase(),
        );
      }
      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyReplies:", error);
    return false;
  }
  return verified;
}

/**
 * Verifies if the retweeters for a given tweet contain the specified twitterUserName.
 * It will keep fetching subsequent pages if available.
 *
 * @param tweetId - The tweet ID for which to fetch retweeters.
 * @param twitterUserName - The username to look for among retweeters.
 * @returns true if a retweet by twitterUserName is found; otherwise, false.
 */
export async function verifyRetweeters(
  tweetId: string,
  twitterUserName: string,
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/retweeters?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, options);
      const data = response.data;

      if (Array.isArray(data.users)) {
        verified = data.retweeters.some(
          (users: any) =>
            users.userName &&
            users.userName.toLowerCase() === twitterUserName.toLowerCase(),
        );
      }
      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyRetweeters:", error);
    return false;
  }
  return verified;
}

/**
 * Verifies if the retweeters for a given tweet contain the specified twitterUserName.
 * It will keep fetching subsequent pages if available.
 *
 * @param tweetId - The tweet ID for which to fetch retweeters.
 * @param twitterUserName - The username to look for among retweeters.
 * @returns true if a retweet by twitterUserName is found; otherwise, false.
 */
export async function verifyQuotes(
  tweetId: string,
  twitterUserName: string,
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/quotes?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, options);
      const data = response.data;

      if (Array.isArray(data.tweets)) {
        verified = data.quotes.some((tweets: any) => {
          tweets.author &&
            tweets.author.userName &&
            tweets.author.userName.toLowerCase() ===
              twitterUserName.toLowerCase();
        });
      }

      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyQuotes:", error);
    return false;
  }
  return verified;
}
