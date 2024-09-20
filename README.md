# Sound Effects Extraction and Transcription API

This project provides two APIs:

1. An Express-based API for extracting sound effects (SFX) from text passages, transcribing audio files, and generating sound effects using OpenAI's GPT and Whisper models, Firebase, and Google Cloud Storage.
2. A FastAPI-based microservice for generating sound effects using the ElevenLabs API.

## Features

- **Extract SFX from Text:** Parse a given text to extract parts that can be used to create sound effects using OpenAI's GPT model.
- **Save and Retrieve Sound Effects:** Save generated sound effects in Firebase and Google Cloud Storage and reuse similar effects if they already exist based on cosine similarity.
- **Audio Transcription:** Upload an audio file to get word-level transcription using OpenAI's Whisper model.
- **Sound Effect Generation:** Use the ElevenLabs API to generate sound effects from text, returning audio in audio/mpeg format.
- **Cosine Similarity Matching:** Find similar phrases by calculating the cosine similarity of phrase embeddings.

## Technologies Used

### Backend (Express API)
- Express.js: API server for handling sound extraction and transcription
- Firebase: Storage for sound effects and embeddings
- Google Cloud Storage: Store audio files
- OpenAI GPT-4: Text extraction and embeddings
- OpenAI Whisper: Audio transcription
- Multer: File upload handler

### Backend (FastAPI API)
- FastAPI: API server for generating sound effects
- ElevenLabs API: Sound effects generation from text
- Pydantic: Data validation

### Shared
- dotenv: Load environment variables
- Axios: HTTP requests for external services

## Requirements

- Node.js (>=16.x) and Python (>=3.8)
- Firebase with service account JSON
- OpenAI API key
- ElevenLabs API key
- Google Cloud Storage bucket
- FFmpeg API (or any sound effect generation service) for the Express backend
- Python and Uvicorn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sfx-extraction-api.git
   cd sfx-extraction-api
   ```

### For Express API

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase by adding your service account JSON file to the project root.

4. Create a `.env` file and add the following environment variables:
   ```
   apikey=YOUR_OPENAI_API_KEY
   databaseURL=YOUR_FIREBASE_DATABASE_URL
   storageBucket=YOUR_FIREBASE_STORAGE_BUCKET
   ```

5. Start the Express server:
   ```bash
   npm run start
   ```

### For FastAPI API

2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv elevenlabs
   ```

3. Create a `.env` file for the FastAPI app and add the ElevenLabs API key:
   ```
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Express API

#### Extract Sound Effects from Text

- **Endpoint:** `POST /extract-sfx`
- **Description:** Extracts sound effect phrases from a text passage.
- **Request:**
  ```json
  {
    "text": "The sword clanged against the shield, thunder roared in the distance."
  }
  ```
- **Response:**
  ```json
  {
    "phrases": ["sword clanged against the shield", "thunder roared"]
  }
  ```

#### Save Sound Effects

- **Endpoint:** `POST /save-sound-effects`
- **Description:** Saves generated sound effects in Firebase and Google Cloud Storage, reusing sound effects if a similar one already exists.
- **Request:**
  ```json
  {
    "phrases": ["sword clanged against the shield", "thunder roared"]
  }
  ```
- **Response:**
  ```json
  {
    "soundEffects": [
      { "phrase": "sword clanged against the shield", "downloadURL": "..." },
      { "phrase": "thunder roared", "downloadURL": "..." }
    ]
  }
  ```

#### Transcribe Audio File

- **Endpoint:** `POST /transcribe-audio`
- **Description:** Upload an audio file for transcription using OpenAI's Whisper.
- **Request:** Multipart form-data with an audio file.
- **Response:**
  ```json
  {
    "transcription": {
      "transcription": "The quick brown fox jumps over the lazy dog.",
      "timestamps": [ ... ]
    }
  }
  ```

### FastAPI API

#### Generate Sound Effects

- **Endpoint:** `POST /generate_sound_effects`
- **Description:** Generate sound effects from text using the ElevenLabs API.
- **Request:**
  ```json
  {
    "phrases": ["thunder roared", "sword clanged against the shield"],
    "duration_seconds": 10,
    "prompt_influence": 0.3
  }
  ```
- **Response:** Audio in audio/mpeg format.

## How to Contribute

1. Fork the repository.
2. Create a new branch for your feature/bugfix.
3. Make your changes and commit them with a clear message.
4. Submit a pull request and describe your changes.
