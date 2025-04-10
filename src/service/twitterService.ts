import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { spawn } from "child_process";
import path from "path";
import JSONbig from "json-bigint";
import { sendMessageToChat } from "./telegramBotService";

const prisma = new PrismaClient();

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
  twitterUserName: string
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    if (tweetId === "" || twitterUserName === "") {
      throw new Error("Invalid tweetId or twitterUserName");
    }
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/replies?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        ...options,
        transformResponse: (data) => {
          return JSONbig({ storeAsString: true }).parse(data);
        },
      });
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
              twitterUserName.toLowerCase()
        );
      }
      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyReplies");
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
  twitterUserName: string
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    if (tweetId === "" || twitterUserName === "") {
      throw new Error("Invalid tweetId or twitterUserName");
    }
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/retweeters?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        ...options,
        transformResponse: (data) => {
          return JSONbig({ storeAsString: true }).parse(data);
        },
      });
      const data = response.data;

      if (Array.isArray(data.users)) {
        verified = data.users.some(
          (users: any) =>
            users.userName &&
            users.userName.toLowerCase() === twitterUserName.toLowerCase()
        );
      }
      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyRetweeters");
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
  twitterUserName: string
): Promise<boolean> {
  let cursor = "";
  let verified = false;
  let hasNextPage = true;

  try {
    if (tweetId === "" || twitterUserName === "") {
      throw new Error("Invalid tweetId or twitterUserName");
    }
    while (!verified && hasNextPage) {
      let url = `${BASE_URL}/twitter/tweet/quotes?tweetId=${tweetId}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        ...options,
        transformResponse: (data) => {
          return JSONbig({ storeAsString: true }).parse(data);
        },
      });
      const data = response.data;

      if (Array.isArray(data.tweets)) {
        verified = data.tweets.some((tweets: any) => {
          return (
            tweets.author &&
            tweets.author.userName &&
            tweets.author.userName.toLowerCase() ===
              twitterUserName.toLowerCase()
          );
        });
      }

      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in verifyQuotes");
    return false;
  }
  return verified;
}

/**
 * Fetches the user's followings.
 * It will keep fetching subsequent pages if available.
 *
 * @param twitterUserName - The username to look for among retweeters.
 * @param flag - A boolean flag to check if the user is a following joinzo or not.
 * @returns List[Object{following's-name, following's-twitter-Id, following's display_name}] for a given twitterUserName.
 */
export async function fetchFollowings(
  twitterUserName: string,
  flag: boolean = false,
  twitterHandle: string = process.env.TWITTER_USERNAME?.toLowerCase() as string
): Promise<Boolean | { id: BigInt; displayName: string; username: string }[]> {
  let cursor = "";
  let following: { id: bigint; displayName: string; username: string }[] = [];
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      let url = `${BASE_URL}/twitter/user/followings?userName=${twitterUserName}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      const response = await axios.get(url, {
        ...options,
        responseType: "text",
        transformResponse: [
          (data: string) => {
            return JSONbig({ storeAsString: true }).parse(data);
          },
        ],
      });

      const data = response.data;

      if (Array.isArray(data.followings)) {
        if (flag) {
          const found = data.followings.some((following: any) => {
            return (
              following.screen_name &&
              following.screen_name.toLowerCase() ===
                twitterHandle.toLowerCase()
            );
          });
          if (found) {
            return true;
          }
        } else {
          const newFollowing = data.followings.map((following: any) => {
            return {
              id: BigInt(following.id),
              displayName: following.name,
              username: following.screen_name,
            };
          });
          following = following.concat(newFollowing);
        }
      }

      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in fetchFollowers");
    return flag ? false : [];
  }
  return flag ? false : following;
}

/**
 * Fetches the user's followers.
 * It will keep fetching subsequent pages if available.
 *
 * @param twitterUserName - The username to look for among retweeters.
 * @returns List[Object{follower's-name, follower's-twitter-Id , follower's display_name}] for a given twitterUserName.
 */
export async function fetchFollowers(
  twitterUserName: string
): Promise<{ id: BigInt; displayName: string; username: string }[]> {
  let cursor = "";
  let followers: { id: bigint; displayName: string; username: string }[] = [];
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      let url = `${BASE_URL}/twitter/user/followers?userName=${twitterUserName}`;
      if (cursor) {
        url = `${url}&cursor=${cursor}`;
      }

      let response;
      try {
        response = await axios.get(url, {
          ...options,
          responseType: "text",
          transformResponse: [
            (data: string) => {
              return JSONbig({ storeAsString: true }).parse(data);
            },
          ],
        });
      } catch (err) {
        console.error("Error in fetchFollowers:", err);
        return [];
      }

      const data = response!.data;

      if (Array.isArray(data.followers)) {
        const newFollower = data.followers.map((followers: any) => {
          return {
            id: BigInt(followers.id),
            displayName: followers.name,
            username: followers.screen_name,
          };
        });
        followers = followers.concat(newFollower);
      }

      hasNextPage = data.has_next_page;
      cursor = data.next_cursor;
    }
  } catch (error) {
    console.error("Error in fetchFollowers");
    return [];
  }
  return followers;
}

// Fetch mutual Connections by taking the intersection of followers and followings
export async function fetchMutualConnections(
  twitterUserName: string
): Promise<{ id: BigInt; displayName: string; username: string }[]> {
  const followers = await fetchFollowers(twitterUserName);
  const followings = (await fetchFollowings(twitterUserName)) as {
    id: BigInt;
    displayName: string;
    username: string;
  }[];
  const mutual = followers.filter((follower) =>
    followings.some((following) => following.id === follower.id)
  );
  return mutual;
}

/**
 * Fetches the user's Twitter Info.
 *
 * @param twitterUserName - The username to fetch data for.
 * @returns Object{twitterId, userName} for a given twitterUserName.
 */
export async function getTwitterInfo(
  twitterUserName: string
): Promise<{ id: string; name: string }> {
  try {
    let url = `${BASE_URL}/twitter/user/info?userName=${twitterUserName}`;

    const response = await axios.get(url, {
      ...options,
      transformResponse: (data) => {
        return JSONbig({ storeAsString: true }).parse(data);
      },
    });
    const data = response.data;

    if (data.data === null) {
      throw Error("User not found");
    }
    const userInfo = {
      id: data.data.id,
      name: data.data.userName,
    };
    return userInfo;
  } catch (error) {
    console.error("Error Fetching Twitter Info");
    return { id: "0", name: "" };
  }
}

/**
 * Fetches the latest tweet from the given username.
 * Assumes the API returns an object with a "tweets" array.
 */
async function fetchLatestTweet(username: string): Promise<any | null> {
  const url = `${BASE_URL}/twitter/user/last_tweets?userName=${username}`;
  try {
    const response = await axios.get(url, options);
    const data = response.data;
    if (Array.isArray(data.data.tweets) && data.data.tweets.length > 0) {
      const validTweets = data.data.tweets.filter(
        (tweet: any) => tweet.retweeted_tweet === null
      );
      if (validTweets.length === 0) {
        return null;
      }
      const tweet = validTweets[0];
      if (
        new Date(tweet.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        return null;
      }
      return tweet;
    }
    return null;
  } catch (err) {
    console.error("Error in fetchLatestTweet");
    return null;
  }
}

/**
 * Function to run python script that
 * the script takes input the latest tweet and generate a telegram notification for the same.
 */
async function runPythonScript(jsonStr: string) {
  // Build an absolute path using __dirname
  console.log(jsonStr);
  const scriptPath = path.join(__dirname, "notification.py");
  const pythonProcess = spawn("python3", [scriptPath, jsonStr]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`🐍 Python Output: ${data.toString()}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`❌ Python Error: ${data.toString()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`🔄 Python script exited with code ${code}`);
  });
}

/**
 * Creates a Twitter task for the latest tweet.
 * The task format is:
 *   title: twitter_fetchTime (formatted as - Twitter hh:mm)
 *   cta: complete
 *   description: like, comment, retweet, qrt,
 *   link: twitter_post link
 *   image: null
 *   submitType: NONE
 *   type: DAILY
 *   points: 300
 *   platform: TWITTER
 */
export async function createTwitterTask(): Promise<void> {
  const username = process.env.TWITTER_USERNAME;
  try {
    const tweet = await fetchLatestTweet(username as string);
    if (!tweet) {
      return;
    }

    const payload = JSON.stringify({
      tweet: tweet.text,
      tweet_link: tweet.twitterUrl,
    });
    runPythonScript(payload);

    const existingTask = await prisma.tasks.findFirst({
      where: {
        link: tweet.twitterUrl,
        platform: "TWITTER",
      },
    });
    if (existingTask) {
      console.log("Task already exists for this tweet link:", tweet.twitterUrl);
      return;
    }
    const task = await prisma.tasks.create({
      data: {
        title: "Twitter Announcement",
        cta: "complete",
        description: "like, comment, retweet, qrt",
        link: tweet.twitterUrl,
        image: null,
        submitType: "NONE",
        type: "DAILY",
        checkFor: ["REACT", "REPLY", "RETWEET", "QUOTE"],
        points: 300,
        platform: "TWITTER",
      },
    });
    sendMessageToChat(
      process.env.TELEGRAM_ANNOUNCEMENT_CHAT_ID!,
      `New Twitter Task Created: ${tweet.text}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Open The Zo App",
                web_app: { url: process.env.TELEGRAM_MINI_APP! },
              },
            ],
          ],
        },
      }
    );
    console.log("Twitter task created", task);
  } catch (error) {
    console.error("Error in createTwitterTask:", error);
  }
}

/**
 * Removes Twitter tasks (from the Tasks table) that were created more than 24 hours ago.
 */
export async function removeExpiredTwitterTasks(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const result = await prisma.tasks.deleteMany({
      where: {
        platform: "TWITTER",
        type: "DAILY",
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });
    console.log("Expired Twitter tasks removed");
  } catch (error) {
    console.error("Error in removeExpiredTwitterTasks:", error);
  }
}
