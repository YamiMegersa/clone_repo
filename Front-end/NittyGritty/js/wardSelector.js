/**
 * wardSelector.js
 *
 * Three-level cascading dropdown: Province → Municipality → Ward
 * Fetches geography data dynamically from the database API using IDs.
 */

function setOptions(select, items, placeholder) {
  select.innerHTML = '';
  const def = new Option(placeholder, '', true, true);
  def.disabled = true;
  select.appendChild(def);
  items.forEach(({ value, label }) => select.appendChild(new Option(label, value)));
}

function resetSelect(select, placeholder, disabled = true) {
  select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
  select.disabled = disabled;
}

export async function initWardSelector() {
  console.log("Ward Selector Script Started!"); // Debug check

  const provinceEl     = document.getElementById('province-select');
  const municipalityEl = document.getElementById('municipality-select');
  const wardEl         = document.getElementById('ward-select');

  if (!provinceEl || !municipalityEl || !wardEl) {
    console.error('Missing one or more select elements in the DOM.');
    return;
  }

  // Set initial loading state
  provinceEl.disabled = true;
  provinceEl.innerHTML = '<option value="" disabled selected>Loading provinces…</option>';
  resetSelect(municipalityEl, 'Select a municipality…');
  resetSelect(wardEl, 'Select a ward…');

  // ── 1. Populate Provinces ────────────────────────────────────────────────
  try {
    const res = await fetch('/api/geography/provinces');
    if (!res.ok) throw new Error('Failed to load provinces from DB');
    
    const provinces = await res.json(); 
    console.log("Provinces from Database:", provinces); // See actual column names

    setOptions(
      provinceEl,
      provinces.map((p) => ({ 
        value: p.ProvinceID || p.id, 
        label: p.ProvinceName || p.Province || p.name || 'Unknown Province'
      })),
      'Select a province…'
    );
    provinceEl.disabled = false;
  } catch (err) {
    console.error('Province Fetch Error:', err);
    provinceEl.innerHTML = '<option value="" disabled selected>Failed to load database</option>';
    return;
  }

  // ── 2. Province → Municipality ───────────────────────────────────────────
  provinceEl.addEventListener('change', async () => {
    const selectedProvinceId = provinceEl.value; 

    resetSelect(municipalityEl, 'Loading municipalities…', true);
    resetSelect(wardEl, 'Select a ward…', true);

    try {
      const res = await fetch(`/api/geography/provinces/${selectedProvinceId}/municipalities`);
      if (!res.ok) throw new Error('Failed to load municipalities');
      
      const municipalities = await res.json(); 
      console.log("Municipalities from Database:", municipalities);

      setOptions(
        municipalityEl,
        municipalities.map((m) => ({ 
          value: m.MunicipalityID || m.id, 
          label: m.MunicipalityName || m.Municipality || m.name || 'Unknown Municipality'
        })),
        'Select a municipality…'
      );
      municipalityEl.disabled = false;
    } catch (err) {
      console.error('Municipality Fetch Error:', err);
      resetSelect(municipalityEl, 'Error loading municipalities');
    }
  });

  // ── 3. Municipality → Ward ───────────────────────────────────────────────
  municipalityEl.addEventListener('change', async () => {
    const selectedMunicipId = municipalityEl.value; 

    resetSelect(wardEl, 'Loading wards…', true);

    try {
      const res = await fetch(`/api/geography/municipalities/${selectedMunicipId}/wards`);
      if (!res.ok) throw new Error('Failed to load wards');
      
      const wards = await res.json(); 
      console.log("Wards from Database:", wards);

      setOptions(
        wardEl,
        wards.map((w) => ({
          value: w.WardID || w.id,
          label: `Ward ${w.WardID || w.WardNo || '?'}`
        })),
        'Select a ward…'
      );
      wardEl.disabled = false;
    } catch (err) {
       console.error('Ward Fetch Error:', err);
       resetSelect(wardEl, 'Error loading wards');
    }
  });

  // ── 4. Ward selected — Fire Custom Event ─────────────────────────────────
  wardEl.addEventListener('change', async () => {
    const selectedWardId = wardEl.value;
    try {
        const res = await fetch(`/api/geography/wards/${selectedWardId}`);
        if (res.ok) {
            const wardData = await res.json();
            document.dispatchEvent(new CustomEvent('ward:selected', { detail: wardData }));
        }
    } catch(err) {
         console.error('Event Dispatcher Error:', err);
    }
  });
}