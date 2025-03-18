import { throws } from "assert";
import axios from "axios";
import express, { Request, Response } from "express";

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

      //*NOTE: The twitterapi.io's doc for this endpoint mentions that the response will have the key "replies", but instead the generated response has the key "tweets";
      //*NOTE: In future if the api endpoint or doc is updated, make the necessary changes as follows :
      //*NOTE: data.tweets->data.replies(or as mentioned in docs);
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
 * Verifies if the Quotation for a given tweet contain the specified twitterUserName.
 * It will keep fetching subsequent pages if available.
 *
 * @param tweetId - The tweet ID for which to fetch quotation.
 * @param twitterUserName - The username to look for among retweeters.
 * @returns true if a quotation by twitterUserName is found; otherwise, false.
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

/**
 * Fetches the user's followers.
 * It will keep fetching subsequent pages if available.
 *
 * @param twitterUserName - The username to look for among retweeters.
 * @returns List[Object{follower's-name, follower's-twitter-Id}] for a given twitterUserName.
 */
export async function fetchFollowers(
  twitterUserName: string,
): Promise<{ id: bigint; name: string }[]> {
  let cursor = "";
  let followers: { id: bigint; name: string }[] = [];
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      let url = `${BASE_URL}/twitter/user/followers?userName=${twitterUserName}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, options);
      const data = response.data;

      if (Array.isArray(data.followers)) {
        const newFollower = data.followers.map((follower: any) => {
          return { id: BigInt(follower.id), name: follower.name };
        });
        followers = followers.concat(newFollower);
      }

      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in fetchFollowers:", error);
    return [];
  }
  return followers;
}

/**
 * Fetches the user's Twitter Info.
 *
 * @param twitterUserName - The username to fetch data for.
 * @returns Object{twitterId, userName} for a given twitterUserName.
 */
export async function getTwitterInfo(
  twitterUserName: string,
): Promise<{ id: BigInt; name: string }> {
  try {
    let url = `${BASE_URL}/twitter/user/info?userName=${twitterUserName}`;

    const response = await axios.get(url, options);
    const data = response.data;

    if (data.data === null) {
      Error("User not found");
    }
    const userInfo = {
      id: data.data.id,
      name: data.data.userName,
    };
    return userInfo;
  } catch (error) {
    console.error("Error Occured :", error);
    return { id: BigInt(0), name: "" };
  }
}
