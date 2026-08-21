from sentence_transformers import SentenceTransformer


# Load the embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embedding(text: str):
    """
    Convert text into a numerical vector.
    """
    embedding = model.encode(text)

    return embedding.tolist()


if __name__ == "__main__":
    text = "User frequently listens to Bollywood music"

    vector = create_embedding(text)

    print("Text:", text)
    print("Vector length:", len(vector))
    print("First 5 values:", vector[:5])