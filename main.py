import os
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

app = FastAPI()

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

class SoundRequest(BaseModel):
    phrases: list[str]
    duration_seconds: int = 10
    prompt_influence: float = 0.3

@app.post("/generate_sound_effects")
async def generate_sound_effects(request: SoundRequest):
    try:
        audio_data = []
        for index, text in enumerate(request.phrases):
            result = elevenlabs.text_to_sound_effects.convert(
                text=text,
                duration_seconds=request.duration_seconds,
                prompt_influence=request.prompt_influence,
            )
            # Combine all chunks into a single bytes object
            audio_content = b"".join(chunk for chunk in result)
            audio_data.append(audio_content)

        # Return the first generated audio file as an example
        return Response(content=audio_data[0], media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
