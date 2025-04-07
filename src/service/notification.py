import os
import json
import openai
import telegram
import asyncio
import hashlib
import sys
from dotenv import load_dotenv
from telegram.helpers import escape_markdown

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_NOTIFICATION_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_NOTIFICATION_CHAT_ID")

# Initialize OpenAI and Telegram clients
openai_client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)

# Templates for different tweet types
MESSAGE_TEMPLATES = {
    "partnership": "🤝 *New Partnership Alert!* 🤝\n\n{tweet}\n\nFollow us on X to stay tuned!\n\n🔗 [Tweet Link]({tweet_link})",
    "announcement": "🚀 *Big Announcement!* 🚀\n\n{tweet}\n\nStay updated with the latest news!\n\n🔗 [Tweet Link]({tweet_link})",
    "ama": "🎧 *AMA Session Incoming!* 🎧\n\n{tweet}\n\nDon’t miss out! Join us for insights and discussions.\n\n🔗 [Tweet Link]({tweet_link})"
}

def get_tweet_from_args():
    try:
        tweet_data = json.loads(sys.argv[1])
        return tweet_data.get("tweet", "").strip(), tweet_data.get("tweet_link", "").strip()
    except (IndexError, json.JSONDecodeError):
        return None, None

def generate_tweet_hash(tweet):
    return hashlib.sha256(tweet.lower().strip().encode()).hexdigest()

def load_processed_tweets():
    try:
        with open("processed_tweets.json", "r", encoding="utf-8") as file:
            data = json.load(file)
            return data.get("last_tweet_hash"), set(data.get("ignored_hashes", [])), data.get("last_sent_message", "")
    except (FileNotFoundError, json.JSONDecodeError):
        return None, set(), ""

def save_processed_tweets(last_hash, ignored_hashes, last_message):
    with open("processed_tweets.json", "w", encoding="utf-8") as file:
        json.dump({
            "last_tweet_hash": last_hash,
            "ignored_hashes": list(ignored_hashes),
            "last_sent_message": last_message
        }, file, ensure_ascii=False)

async def categorize_tweet(tweet):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a tweet classifier. Categorize the tweet into one of three categories: 'partnership', 'announcement', or 'ama'. If it does not fit, return 'ignore'."
                },
                {
                    "role": "user",
                    "content": f"Categorize the following tweet:\n\n{tweet}"
                }
            ]
        )
        category = response.choices[0].message.content.strip().lower()
        return category if category in MESSAGE_TEMPLATES else "ignore"
    except Exception as e:
        print(f"❌ OpenAI API error: {e}")
        return "ignore"

async def generate_refined_message(tweet, category, tweet_link):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a creative social media writer crafting content for Telegram.\n"
                        "Rewrite the following tweet to sound engaging and natural for a Telegram announcement.\n"
                        "Avoid repeating words or phrases like 'new partnership alert' or 'big announcement' that are already in the template.\n"
                        "Avoid including the tweet link."
                    )
                },
                {
                    "role": "user",
                    "content": tweet
                }
            ]
        )
        final_tweet = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ OpenAI message generation error: {e}")
        final_tweet = tweet  # fallback

    # Escape only characters required for MarkdownV2 (not over-escaping!)
    safe_tweet = escape_markdown(final_tweet, version=2).replace("\\!", "!")
    safe_link = escape_markdown(tweet_link, version=2).replace("\\!", "!")

    message = MESSAGE_TEMPLATES[category].format(
        tweet=safe_tweet,
        tweet_link=safe_link
    )

    return message

async def send_telegram_message(message):
    try:
        async with bot:
            await bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=message, parse_mode="MarkdownV2")
        print("✅ Message sent to Telegram!")
    except Exception as e:
        print(f"❌ Telegram error: {e}")

async def main():
    last_tweet_hash, ignored_hashes, last_sent_message = load_processed_tweets()
    tweet, tweet_link = get_tweet_from_args()

    if tweet:
        current_tweet_hash = generate_tweet_hash(tweet)

        if current_tweet_hash in ignored_hashes or current_tweet_hash == last_tweet_hash:
            print("⏳ Skipping duplicate or ignored tweet.")
        else:
            category = await categorize_tweet(tweet)
            if category == "ignore":
                ignored_hashes.add(current_tweet_hash)
            else:
                message = await generate_refined_message(tweet, category, tweet_link)

                if message != last_sent_message:
                    await send_telegram_message(message)
                    last_tweet_hash = current_tweet_hash
                    last_sent_message = message

        save_processed_tweets(last_tweet_hash, ignored_hashes, last_sent_message)
    else:
        print("⏳ No valid tweet data provided.")

if __name__ == "__main__":
    asyncio.run(main())