const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const csvPath = './data.csv';
const outputPath = './public/memory.json';

const getEmbedding = async (text) => {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });

  const data = await res.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Embedding failed for input: "${text}". Error: ${JSON.stringify(data)}`);
  }

  return data.data[0].embedding;
};

const run = async () => {
  const results = [];
  const texts = [];

  console.log('🔄 Reading CSV...');
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      const values = Object.values(row).filter(Boolean).join(' ').trim();
      if (values) texts.push(values);
    })
    .on('end', async () => {
      console.log(`🧠 Generating ${texts.length} embeddings...`);
      for (const text of texts) {
        try {
          const embedding = await getEmbedding(text);
          results.push({ text, embedding });
        } catch (err) {
          console.error("❌ Failed embedding:", text);
        }
      }
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`✅ memory.json written to ${outputPath}`);
    });
};

run();

