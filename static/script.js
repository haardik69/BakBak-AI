let models = { coqui: [], elevenlabs: [] };

async function fetchModels() {
  try {
    const res = await fetch('/models');
    if (!res.ok) throw new Error('Could not load models');
    models = await res.json();
    updateModelOptions();
  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

function updateModelOptions() {
  const engine = document.querySelector('input[name="tts_engine"]:checked').value;

  document.getElementById('coquiModels').style.display = engine === 'coqui' ? 'block' : 'none';
  document.getElementById('elevenlabsModels').style.display = engine === 'elevenlabs' ? 'block' : 'none';

  if (engine === 'coqui') {
    const sel = document.getElementById('coquiModelSelect');
    sel.innerHTML = '';
    (models.coqui || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.split('/').pop().replace(/-/g, ' ');
      sel.appendChild(opt);
    });
  } else {
    const sel = document.getElementById('elevenModelSelect');
    sel.innerHTML = '';
    (models.elevenlabs || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
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
  let model;
  if (engine === 'coqui') {
    model = document.getElementById('coquiModelSelect').value;
  } else {
    model = document.getElementById('elevenModelSelect').value;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.innerText = 'Processing...';

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, engine, model })
    });
    if (!res.ok) throw new Error('Generation failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const player = document.getElementById('audioPlayer');
    player.src = url;
    player.load();
    document.getElementById('audioContainer').style.display = 'block';

    document.getElementById('downloadBtn').onclick = async () => {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `${engine}_${model.split('/').pop()}.mp3`,
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
    };
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Generate Speech';
  }
});
