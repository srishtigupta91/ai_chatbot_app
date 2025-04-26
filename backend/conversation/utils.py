import os
from openai import OpenAI

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

def generate_summary(text):
    response = client.completions.create(model="gpt-3.5-turbo-instruct",
                                         prompt=f"Summarize the following text:\n\n{text}",
                                         max_tokens=150)
    summary = response.choices[0].text.strip()
    return summary