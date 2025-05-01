let models = { coqui: [], elevenlabs: [] };

async function fetchModels() {
  try {
    const res = await fetch('https://bakbak-ai-backend-818659842925.asia-south1.run.app/models');
    if (!res.ok) throw new Error('Could not load models');
    const data = await res.json();
    models.coqui = data.coqui || [];
    models.elevenlabs = data.elevenlabs || [];
    updateModelOptions();
  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

function updateModelOptions() {
  const engine = document.querySelector('input[name="tts_engine"]:checked').value;

  document.getElementById('coquiModels').style.display = engine === 'coqui' ? 'block' : 'none';
  document.getElementById('elevenlabsModels').style.display = engine === 'elevenlabs' ? 'block' : 'none';

  const sel = engine === 'coqui'
    ? document.getElementById('coquiModelSelect')
    : document.getElementById('elevenModelSelect');
  
  sel.innerHTML = '';
  const list = engine === 'coqui' ? models.coqui : models.elevenlabs;

  if (list.length === 0) {
    const opt = document.createElement('option');
    opt.disabled = true;
    opt.textContent = `No ${engine} models available`;
    sel.appendChild(opt);
  } else {
    list.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = engine === 'coqui' ? m.split('/').pop().replace(/-/g, ' ') : m;
      sel.appendChild(opt);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  fetchModels();
  document.querySelectorAll('input[name="tts_engine"]').forEach(radio => {
    radio.addEventListener('change', updateModelOptions);
  });
});

document.getElementById('generateBtn').addEventListener('click', async () => {
  const text = document.getElementById('inputText').value.trim();
  if (!text) {
    alert('Please enter some text.');
    return;
  }

  const engine = document.querySelector('input[name="tts_engine"]:checked').value;
  let model = engine === 'coqui'
    ? document.getElementById('coquiModelSelect').value
    : document.getElementById('elevenModelSelect').value;

  if (!model) {
    alert('Please select a model.');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.innerText = 'Processing...';

  const player = document.getElementById('audioPlayer');
  player.src = '';
  document.getElementById('audioContainer').style.display = 'none';

  try {
    const res = await fetch('https://bakbak-ai-backend-818659842925.asia-south1.run.app/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, engine, model })
    });
    if (!res.ok) throw new Error('Generation failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    player.src = url;
    player.load();
    player.onerror = () => {
      alert("Failed to load audio.");
      console.error("Audio error:", player.error);
    };

    document.getElementById('audioContainer').style.display = 'block';

    document.getElementById('downloadBtn').onclick = async () => {
      const filename = `${engine}_${model.split('/').pop()}.mp3`;

      if (window.showSaveFilePicker) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'MP3 Files',
              accept: { 'audio/mpeg': ['.mp3'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          alert("File saved successfully!");
        } catch (err) {
          console.error("Save failed:", err);
          alert("Failed to save the file.");
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Generate Speech';
  }
});
