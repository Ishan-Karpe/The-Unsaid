
import asyncio
import os
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.append(str(Path(__file__).parent))

from app.services.openrouter import OpenRouterService
from dotenv import load_dotenv

# Load env
load_dotenv(Path(__file__).parent.parent / ".env")

async def test_ai():
    service = OpenRouterService()
    print(f"API Key present: {bool(service.api_key)}")
    print(f"Model: {service.model}")

    try:
        print("Testing tone...")
        result = await service.tone("I am very angry", "My boss", "I quit")
        print("Success!")
        print(result)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ai())
