const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path'); 
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('./servies.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.databaseURL,
   storageBucket: process.env.storageBucket
});

const adminDatabase = admin.database();
const adminStorage = admin.storage().bucket();

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/sound_effects', express.static(path.join(__dirname, 'sound_effects')));

const openai = new OpenAI({
  apiKey: process.env.apikey,
});


app.post('/extract-sfx', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const prompt = `I need you to identify parts from the following passage that I can use to create SFX sounds with. Only include the part that I can use to create the SFX sound in a list.\n\n${text}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('Unexpected API response format');
    }

    const phrases = response.choices[0].message.content.trim().split('\n');
    const filteredPhrases = phrases.filter(phrase => phrase.length > 0);

    res.json({ phrases: filteredPhrases });
  } catch (error) {
    console.error('Error in /extract-sfx:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to extract SFX phrases: ' + error.message });
  }
});

// to Upload pdf file 
const storageMulter = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storageMulter });

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vectors are not properly defined or of unequal length');
  }
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function createEmbedding(phrase) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: phrase,
    encoding_format: "float",
  });
  return embeddingResponse.data[0].embedding;
}

async function getExistingEmbeddings() {
  const snapshot = await adminDatabase.ref('soundEffects').once('value');
  const soundEffects = snapshot.val();
  if (!soundEffects) return [];

  return Object.keys(soundEffects).map((key) => ({
    phrase: key,
    embedding: soundEffects[key].embedding,
    downloadURL: soundEffects[key].downloadURL,
  }));
}

function findSimilarPhrase(existingEmbeddings, newEmbedding) {
  let maxSimilarity = 0;
  let similarPhrase = null;

  for (const { phrase, embedding, downloadURL } of existingEmbeddings) {
    if (!embedding || !Array.isArray(embedding)) {
      continue;
    }

    const similarity = cosineSimilarity(embedding, newEmbedding);
    console.log(`Comparing with phrase: "${phrase}", Similarity: ${similarity}`);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      similarPhrase = { phrase, similarity, downloadURL };
    }
  }

  return { maxSimilarity, similarPhrase };
}

app.post('/save-sound-effects', async (req, res) => {
  const { phrases } = req.body;
  if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
    return res.status(400).json({ error: 'Phrases are required' });
  }

  try {
    const existingEmbeddings = await getExistingEmbeddings();

    const soundEffectPromises = phrases.map(async (phrase) => {
      try {
        const newEmbedding = await createEmbedding(phrase);

        if (!newEmbedding || !Array.isArray(newEmbedding)) {
          throw new Error(`Invalid embedding for phrase "${phrase}"`);
        }

        const { maxSimilarity, similarPhrase } = findSimilarPhrase(existingEmbeddings, newEmbedding);

        if (maxSimilarity > 0.9 && similarPhrase) {
          console.log(`Data already exists for phrase: "${phrase}" with similarity: ${maxSimilarity}. Reusing existing sound effect.`);
          return { phrase, downloadURL: similarPhrase.downloadURL };
        }

        console.log(`Creating new data for phrase: "${phrase}". Generating sound effect.`);
        const response = await axios.post('https://pythonapi-cozl.onrender.com/generate_sound_effects', {
          phrases: [phrase],
          duration_seconds: 10,
          prompt_influence: 0.3,
        }, {
          responseType: 'arraybuffer'
        });

        const audioBuffer = Buffer.from(response.data, 'binary');
        const filename = `sound_effects/${phrase}_${Date.now()}.mp3`;
        const file = adminStorage.file(filename);
        await file.save(audioBuffer, {
          metadata: {
            contentType: 'audio/mpeg',
          },
          public: true,
        });

        const downloadURL = `https://storage.googleapis.com/${adminStorage.name}/${filename}`;
        const newSoundEffect = {
          phrase: phrase,
          createdAt: new Date().toISOString(),
          downloadURL: downloadURL,
          embedding: newEmbedding,
        };

        const soundEffectRef = adminDatabase.ref('soundEffects/' + phrase);
        await soundEffectRef.set(newSoundEffect);

        existingEmbeddings.push({
          phrase,
          embedding: newEmbedding,
          downloadURL,
        });

        console.log(`New data created and inserted for phrase: "${phrase}".`);
        return { phrase, downloadURL };
      } catch (err) {
        console.error(`Error processing phrase "${phrase}":`, err.message);
        throw err;
      }
    });

    const soundEffects = await Promise.all(soundEffectPromises);
    res.status(200).json({ soundEffects });
  } catch (error) {
    console.error('Error in /save-sound-effects:', error.message);
    res.status(500).json({ error: 'Failed to save sound effects: ' + error.message });
  }
});


app.post('/transcribe-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const transcription = {
      transcription: response.text,
      timestamps: response.words,
    };

    res.json({  transcription });
  } catch (error) {
    console.error('Error in /transcribe-audio:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to transcribe audio: ' + error.message });
  } finally {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});