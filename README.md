# Sound Effects Extraction and Transcription API

This project provides an API for extracting sound effects (SFX) from text passages and transcribing audio files using OpenAI's Whisper model. It integrates with Firebase for storing and retrieving sound effect data, Google Cloud Storage for saving sound files, and OpenAI for generating embeddings and transcriptions.

## Features

- **Extract SFX from Text**: Parses a given text to extract parts that can be used to create sound effects using OpenAI's GPT model.
- **Save and Retrieve Sound Effects**: Saves generated sound effects to Firebase and Google Cloud Storage, reuses similar effects if they already exist based on cosine similarity.
- **Audio Transcription**: Upload an audio file to get word-level transcription using OpenAI's Whisper model.
- **Cosine Similarity Matching**: Finds similar phrases by calculating the cosine similarity of phrase embeddings.

## Technologies Used

- **Backend**: Express.js, Node.js
- **Storage**: Firebase Realtime Database, Firebase Cloud Storage
- **AI Models**:
  - OpenAI GPT-4 for SFX extraction and embeddings
  - OpenAI Whisper for audio transcription
- **File Handling**: Multer for file uploads
- **External Services**:
  - Google Cloud Storage for storing generated sound effects
  - Axios for making HTTP requests
  - FFmpeg (through a separate Python API) for generating sound effects

## Requirements

- Node.js (>=16.x)
- Firebase account with a service account JSON file
- OpenAI API key
- Google Cloud Storage bucket
- Python API for sound effect generation (referenced by the code as https://pythonapi-cozl.onrender.com/generate_sound_effects)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sfx-extraction-api.git
   cd sfx-extraction-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase by adding your `serviceAccount` JSON file to the project root.

4. Create a `.env` file and add the following environment variables:
   ```
   apikey=YOUR_OPENAI_API_KEY
   databaseURL=YOUR_FIREBASE_DATABASE_URL
   storageBucket=YOUR_FIREBASE_STORAGE_BUCKET
   ```

5. Start the server:
   ```bash
   npm run start
   ```

## API Endpoints

### 1. Extract Sound Effects from Text

- **Endpoint**: `POST /extract-sfx`
- **Description**: Extracts parts of a text passage that can be used for generating sound effects.
- **Request**:
  ```json
  {
    "text": "The sword clanged against the shield, thunder roared in the distance."
  }
  ```
- **Response**:
  ```json
  {
    "phrases": [
      "sword clanged against the shield",
      "thunder roared"
    ]
  }
  ```

### 2. Save Sound Effects

- **Endpoint**: `POST /save-sound-effects`
- **Description**: Saves generated sound effects in Firebase and Google Cloud Storage. Reuses sound effects if a similar one already exists.
- **Request**:
  ```json
  {
    "phrases": ["sword clanged against the shield", "thunder roared"]
  }
  ```
- **Response**:
  ```json
  {
    "soundEffects": [
      {
        "phrase": "sword clanged against the shield",
        "downloadURL": "https://storage.googleapis.com/yourbucket/sound_effects/sword_clanged.mp3"
      },
      {
        "phrase": "thunder roared",
        "downloadURL": "https://storage.googleapis.com/yourbucket/sound_effects/thunder_roared.mp3"
      }
    ]
  }
  ```

### 3. Transcribe Audio File

- **Endpoint**: `POST /transcribe-audio`
- **Description**: Upload an audio file and receive word-level transcriptions with timestamps.
- **Request**: Multipart form-data with an audio file.
- **Response**:
  ```json
  {
    "transcription": {
      "transcription": "The quick brown fox jumps over the lazy dog.",
      "timestamps": [
        { "word": "The", "start": 0.1, "end": 0.3 },
        { "word": "quick", "start": 0.4, "end": 0.5 },
        ...
      ]
    }
  }
  ```

## How it Works

1. **SFX Extraction**: A user submits a text passage. The OpenAI GPT-4 model identifies potential sound effects from the text, which are returned in a list.

2. **Cosine Similarity Matching**: Each phrase is embedded using OpenAI's text-embedding model, and compared to existing sound effects using cosine similarity. If a similar phrase is found (with a similarity score > 0.9), the existing sound effect is reused.

3. **Sound Effect Generation**: If no similar sound effect is found, a request is sent to a Python API to generate a new sound effect, which is saved to Firebase and Google Cloud Storage.

4. **Audio Transcription**: A user uploads an audio file, which is transcribed using OpenAI's Whisper model, returning word-level transcription with timestamps.

## How to Contribute

1. Fork the repository.
2. Create a new branch for your feature/bugfix.
3. Make your changes and commit them with a clear message.
4. Submit a pull request and describe your changes.
