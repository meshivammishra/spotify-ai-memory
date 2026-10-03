import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing")

client = genai.Client(api_key=GEMINI_API_KEY)


def create_embedding(text: str):
    """
    Generate a 384-dimensional embedding using Gemini.
    """
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=384
        )
    )

    return result.embeddings[0].values


if __name__ == "__main__":
    text = "User frequently listens to Bollywood music"

    vector = create_embedding(text)

    print("Text:", text)
    print("Vector length:", len(vector))
    print("First 5 values:", vector[:5])
