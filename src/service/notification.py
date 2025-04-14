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
print("🔍 Environment variables loaded")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_COMMUNITY_CHAT_ID")

print(f"🔍 OPENAI_API_KEY set: {'Yes' if OPENAI_API_KEY else 'No'}")
print(f"🔍 TELEGRAM_BOT_TOKEN: {TELEGRAM_BOT_TOKEN[:5]}...{TELEGRAM_BOT_TOKEN[-5:]}")
print(f"🔍 TELEGRAM_CHAT_ID: {TELEGRAM_CHAT_ID}")

# Initialize OpenAI and Telegram clients
try:
    openai_client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)
    print("✅ OpenAI client initialized")
except Exception as e:
    print(f"❌ Failed to initialize OpenAI client: {e}")
    sys.exit(1)

try:
    bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)
    print("✅ Telegram bot initialized")
except Exception as e:
    print(f"❌ Failed to initialize Telegram bot: {e}")
    sys.exit(1)

# Templates for different tweet types
MESSAGE_TEMPLATES = {
    'partnership': "🤝 *New Partnership Alert* 🤝\n\n{tweet}\n\nFollow us on X to stay tuned\\!\n\n🔗 [Tweet Link]({tweet_link})",
    "announcement": "🚀 *Big Announcement* 🚀\n\n{tweet}\n\nStay updated with the latest news\\!\n\n🔗 [Tweet Link]({tweet_link})",
    "ama": "🎧 *AMA Session Incoming* 🎧\n\n{tweet}\n\nDon't miss out\\! Join us for insights and discussions\\.\n\n🔗 [Tweet Link]({tweet_link})"
}

def get_tweet_from_args():
    print("🔍 Attempting to extract tweet data from arguments")
    try:
        if len(sys.argv) < 2:
            print("❌ No command line arguments provided")
            return None, None
        
        print(f"🔍 Raw argument: {sys.argv[1][:50]}...")
        tweet_data = json.loads(sys.argv[1])
        tweet = tweet_data.get("tweet", "").strip()
        tweet_link = tweet_data.get("tweet_link", "").strip()
        
        print(f"✅ Extracted tweet: {tweet[:30]}...")
        print(f"✅ Extracted link: {tweet_link}")
        return tweet, tweet_link
    except IndexError:
        print("❌ Index error while accessing command line arguments")
        return None, None
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"❌ Raw input: {sys.argv[1] if len(sys.argv) > 1 else 'No input'}")
        return None, None

def generate_tweet_hash(tweet):
    return hashlib.sha256(tweet.lower().strip().encode()).hexdigest()

def load_processed_tweets():
    print("🔍 Loading processed tweets history")
    try:
        with open("processed_tweets.json", "r", encoding="utf-8") as file:
            data = json.load(file)
            last_hash = data.get("last_tweet_hash")
            ignored = set(data.get("ignored_hashes", []))
            last_msg = data.get("last_sent_message", "")
            
            print(f"✅ Loaded: Last hash: {last_hash[:10] if last_hash else None}")
            print(f"✅ Loaded: {len(ignored)} ignored tweets")
            print(f"✅ Loaded: Last message: {last_msg[:30] if last_msg else None}...")
            return last_hash, ignored, last_msg
    except FileNotFoundError:
        print("ℹ️ No processed_tweets.json found, starting fresh")
        return None, set(), ""
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing processed_tweets.json: {e}")
        return None, set(), ""

def save_processed_tweets(last_hash, ignored_hashes, last_message):
    print("🔍 Saving processed tweets data")
    try:
        with open("processed_tweets.json", "w", encoding="utf-8") as file:
            json.dump({
                "last_tweet_hash": last_hash,
                "ignored_hashes": list(ignored_hashes),
                "last_sent_message": last_message
            }, file, ensure_ascii=False)
        print("✅ Saved processed tweets data")
    except Exception as e:
        print(f"❌ Error saving processed_tweets.json: {e}")

async def categorize_tweet(tweet):
    print("🔍 Categorizing tweet using OpenAI")
    try:
        print(f"🔍 Sending tweet to OpenAI: {tweet[:50]}...")
        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a tweet classifier. Categorize the tweet into one of three categories: partnership, announcement, or ama. If it does not fit, return ignore."
                },
                {
                    "role": "user",
                    "content": f"Categorize the following tweet:\n\n{tweet}"
                }
            ]
        )
        raw_category = response.choices[0].message.content.strip().lower()
        print(f"✅ OpenAI raw response: '{raw_category}'")
        
        # Clean up the category by removing quotes and extra spaces
        category = raw_category.replace("'", "").replace('"', "").strip()
        print(f"✅ Cleaned category: '{category}'")
        
        if category not in MESSAGE_TEMPLATES:
            print(f"ℹ️ Category '{category}' not in templates, defaulting to 'ignore'")
            return "ignore"
        return category
    except Exception as e:
        print(f"❌ OpenAI API error: {e}")
        print("ℹ️ Defaulting to 'ignore' due to error")
        return "ignore"

async def generate_refined_message(tweet, category, tweet_link):
    print(f"🔍 Generating refined message for category: {category}")
    try:
        print(f"🔍 Sending tweet to OpenAI for refinement: {tweet[:50]}...")
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
        print(f"✅ Refined tweet: {final_tweet[:50]}...")
    except Exception as e:
        print(f"❌ OpenAI message generation error: {e}")
        print("ℹ️ Using original tweet as fallback")
        final_tweet = tweet  # fallback

    try:
        # Proper escaping for MarkdownV2
        def escape_markdown_v2(text):
            # Characters that need escaping in MarkdownV2
            special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
            escaped_text = ""
            for char in text:
                if char in special_chars:
                    escaped_text += f"\\{char}"
                else:
                    escaped_text += char
            return escaped_text
            
        # Use our custom escape function instead of the library's
        safe_tweet = escape_markdown_v2(final_tweet)
        # Make sure URL is properly formatted for Markdown without escaping internal characters
        clean_link = tweet_link.strip()
        
        message = MESSAGE_TEMPLATES[category].format(
            tweet=safe_tweet,
            tweet_link=clean_link
        )
        print(f"✅ Final message created: {message[:50]}...")
        return message
    except KeyError as e:
        print(f"❌ Template key error: {e}")
        print(f"🔍 Available templates: {list(MESSAGE_TEMPLATES.keys())}")
        # Fallback to announcement template
        safe_tweet = escape_markdown_v2(final_tweet)
        message = MESSAGE_TEMPLATES["announcement"].format(
            tweet=safe_tweet,
            tweet_link=clean_link
        )
        print(f"ℹ️ Using fallback template (announcement)")
        return message
    except Exception as e:
        print(f"❌ Error formatting message: {e}")
        # Ultra-safe fallback with minimal formatting
        safe_text = final_tweet.replace("*", "").replace("[", "").replace("]", "")
        return f"Alert\n\n{safe_text}\n\n{clean_link}"

async def test_telegram_bot():
    print("🔍 Testing Telegram bot connection")
    try:
        async with bot:
            me = await bot.get_me()
            print(f"✅ Bot connected successfully: @{me.username}")
            
            # Test if the bot can get chat info
            if TELEGRAM_CHAT_ID:
                try:
                    chat = await bot.get_chat(chat_id=TELEGRAM_CHAT_ID)
                    print(f"✅ Successfully connected to chat: {chat.title if hasattr(chat, 'title') else chat.id}")
                except Exception as e:
                    print(f"❌ Error accessing chat: {e}")
                    print("❌ Bot may not have access to the specified chat or chat ID is invalid")
    except Exception as e:
        print(f"❌ Bot connection test failed: {e}")

async def send_telegram_message(message):
    print("🔍 Attempting to send Telegram message")
    print(f"🔍 Chat ID: {TELEGRAM_CHAT_ID}")
    print(f"🔍 Message length: {len(message)} characters")
    print(f"🔍 Message preview: {message[:100]}...")
    
    if not TELEGRAM_CHAT_ID:
        print("❌ TELEGRAM_CHAT_ID is not set in environment variables")
        return
    
    try:
        async with bot:
            print("🔍 Bot connection established")
            sent_message = await bot.send_message(
                chat_id=TELEGRAM_CHAT_ID, 
                text=message, 
                parse_mode="MarkdownV2",
                disable_web_page_preview=False
            )
            print(f"✅ Message sent successfully! Message ID: {sent_message.message_id}")
            return True
    except telegram.error.BadRequest as e:
        print(f"❌ Telegram BadRequest error: {e}")
        print("❌ This usually means formatting issues with MarkdownV2")
        
        # Try sending without markdown as fallback
        try:
            print("🔍 Attempting to send without markdown formatting")
            # Strip markdown formatting for plain text fallback
            plain_message = message.replace("\\", "")  # Remove escape chars
            for char in ['*', '_', '`', '~']:  # Remove formatting chars
                plain_message = plain_message.replace(char, '')
            
            # Keep link structure but simplify
            plain_message = plain_message.replace("[Tweet Link]", "Link:")
            
            async with bot:
                sent_message = await bot.send_message(
                    chat_id=TELEGRAM_CHAT_ID,
                    text=plain_message,
                    disable_web_page_preview=False
                )
                print("✅ Message sent without markdown formatting")
                return True
        except Exception as fallback_e:
            print(f"❌ Fallback send also failed: {fallback_e}")
            return False
    except telegram.error.Unauthorized as e:
        print(f"❌ Telegram Unauthorized error: {e}")
        print("❌ Bot token may be invalid or revoked")
        return False
    except telegram.error.Forbidden as e:
        print(f"❌ Telegram Forbidden error: {e}")
        print("❌ Bot doesn't have permission to send messages to this chat")
        return False
    except Exception as e:
        print(f"❌ Telegram error: {type(e).__name__}: {e}")
        return False

async def main():
    print("🔍 Starting main execution")
    
    # Test Telegram connection first
    await test_telegram_bot()
    
    last_tweet_hash, ignored_hashes, last_sent_message = load_processed_tweets()
    tweet, tweet_link = get_tweet_from_args()

    if not tweet:
        print("❌ No valid tweet data provided")
        return
    
    print(f"🔍 Processing tweet: {tweet[:50]}...")
    current_tweet_hash = generate_tweet_hash(tweet)
    print(f"🔍 Tweet hash: {current_tweet_hash[:15]}...")

    # Check for duplicates
    if current_tweet_hash in ignored_hashes:
        print("⏳ Skipping ignored tweet")
        return
    
    if current_tweet_hash == last_tweet_hash:
        print("⏳ Skipping duplicate of last tweet")
        return
    
    # Categorize and process
    category = await categorize_tweet(tweet)
    
    if category == "ignore":
        print("⏳ Tweet categorized as 'ignore', adding to ignored_hashes")
        ignored_hashes.add(current_tweet_hash)
        save_processed_tweets(last_tweet_hash, ignored_hashes, last_sent_message)
        return
    
    message = await generate_refined_message(tweet, category, tweet_link)
    
    # Check if message is duplicate
    message_hash = generate_tweet_hash(message)
    last_message_hash = generate_tweet_hash(last_sent_message) if last_sent_message else None
    
    print(f"🔍 New message hash: {message_hash[:15]}...")
    print(f"🔍 Last message hash: {last_message_hash[:15] if last_message_hash else 'None'}...")
    
    if message_hash == last_message_hash:
        print("⏳ Generated message is identical to last sent message, skipping")
    else:
        print("🔍 Sending new message to Telegram")
        success = await send_telegram_message(message)
        if success:
            last_tweet_hash = current_tweet_hash
            last_sent_message = message
            save_processed_tweets(last_tweet_hash, ignored_hashes, last_sent_message)

if __name__ == "__main__":
    print("🔍 Script started")
    asyncio.run(main())
    print("🔍 Script completed")