const fs = require('fs');
const path = require('path');
const { sequelize, Province, Municipality, MockWard } = require('./models'); 

const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/ metropolitan municipality/g, '')
        .replace(/ local municipality/g, '')
        .replace(/ district municipality/g, '')
        .trim();
};

// Navigate: Up one -> Front-end -> analytics -> data
const dataDir = path.join(__dirname, '..', 'Front-end', 'analytics', 'data');
const provPath = path.join(dataDir, 'sa_provincial.json');
const muniPath = path.join(dataDir, 'sa_municipal.json');
const wardPath = path.join(dataDir, 'sa_wards.json');

// A bank of realistic South African names for our mock councillors
const councillorNames = [
    "Thabo Mokoena", "Lerato Dlamini", "Johan Van der Merwe", "Fatima Patel",
    "Sipho Ndlovu", "Naledi Nkosi", "Pieter Botha", "Zanele Khumalo",
    "Bradley Jacobs", "Amina Desai", "Bheki Zwane", "Kgomotso Modise",
    "Heinrich Muller", "Nomsa Baloyi", "Craig Smith", "Lindiwe Sithole",
    "Jabulani Ngcobo", "Tanya Coetzee", "Sibusiso Mahlangu", "Priya Moodley"
];

const getRandomCouncillor = () => {
    if (Math.random() > 0.95) return null; 
    const randomIndex = Math.floor(Math.random() * councillorNames.length);
    return councillorNames[randomIndex];
};

// Dictionary to translate MDB abbreviations into your Database Integer IDs
const provinceIdMap = {
    'GT': 1, 'GAU': 1, 
    'WC': 2, 'EC': 3,
    'NC': 4, 'FS': 5,
    'KZN': 6, 'NW': 7,
    'MP': 8, 'LIM': 9
};

const provinceFullNameToId = {
    'Gauteng': 1, 
    'Western Cape': 2, 
    'Eastern Cape': 3,
    'Northern Cape': 4, 
    'Free State': 5,
    'KwaZulu-Natal': 6, 
    'North West': 7,
    'Mpumalanga': 8, 
    'Limpopo': 9
};

// Dictionary to translate MDB abbreviations into Full Province Names
const provinceNameMap = {
    'GT': 'Gauteng', 'GAU': 'Gauteng', 
    'WC': 'Western Cape', 'EC': 'Eastern Cape',
    'NC': 'Northern Cape', 'FS': 'Free State',
    'KZN': 'KwaZulu-Natal', 'NW': 'North West',
    'MP': 'Mpumalanga', 'LIM': 'Limpopo'
};

async function seedDatabase() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection successful. Starting transactional import...\n');

        // ==========================================
        // START THE MANAGED TRANSACTION
        // ==========================================
        await sequelize.transaction(async (t) => {

            // --- 2. MUNICIPALITIES ---
            if (fs.existsSync(muniPath)) {
                console.log('Reading and inserting Municipalities...');
                const muniFile = JSON.parse(fs.readFileSync(muniPath, 'utf8'));
                
                const munisToInsert = muniFile.features.map(feature => {
                    const provAbbreviation = feature.properties.PROVINCE; 
                    const translatedId = provinceIdMap[provAbbreviation] || null;
                    //console.log("🔎 Available Municipality Properties:", muniFile.features[0].properties);
                    return {
                        MunicipalityName: feature.properties.MUNICNAME, 
                        ProvinceID: translatedId 
                    };
                });

                await Municipality.bulkCreate(munisToInsert, { 
                    ignoreDuplicates: true, 
                    transaction: t  // <-- Attached to transaction
                });
                console.log(`✅ Municipalities staged.`);
            }

            // --- 3. WARDS ---
            if (fs.existsSync(wardPath)) {
                console.log('Reading and inserting Wards...');
                const wardFile = JSON.parse(fs.readFileSync(wardPath, 'utf8'));
                
                // Fetch the newly auto-incremented Municipalities using the transaction
                const dbMunicipalities = await Municipality.findAll({ transaction: t });

// Add this helper function at the top of your seedGeography.js
const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/ metropolitan municipality/g, '')
        .replace(/ local municipality/g, '')
        .replace(/ district municipality/g, '')
        .replace(/-/g, ' ') // 🚨 Replace hyphens with spaces
        .trim();
};

// --- Inside your Wards logic ---

            // 1. When creating the lookup dictionary, normalize the name
            const muniIdLookup = {};
            dbMunicipalities.forEach(muni => {
                // Assuming your column is named 'MunicipalityName' based on our previous discovery
                if (muni.MunicipalityName) {
                    const cleanName = normalizeName(muni.MunicipalityName);
                    //console.log(`DEBUG: Adding to lookup -> '${cleanName}'`);
                    muniIdLookup[cleanName] = muni.MunicipalityID;
                }
            });

            // 2. When mapping the wards, normalize the incoming name
            const wardsToInsert = wardFile.features.map(feature => {
                const rawMuniName = feature.properties.Municipali; 
                let matchedMuniId = null;
                
                if (rawMuniName) {
                    const cleanName = normalizeName(rawMuniName);
                    matchedMuniId = muniIdLookup[cleanName];
                }
           // console.log(`⚠️ Could not match: ${rawMuniName} (Normalized: ${normalizeName(rawMuniName)})`);}
           //console.log(rawMuniName,matchedMuniId);
           if (rawMuniName && !matchedMuniId) {
    console.log(`⚠️ Could not match: ${rawMuniName} (Normalized: ${normalizeName(rawMuniName)})`);
} 
           return {
                WardID: feature.properties.WardNo, 
                MunicipalityID: matchedMuniId,      
                WardCouncillor: getRandomCouncillor() 
            };
        });

                const validWards = wardsToInsert.filter(w => w.MunicipalityID !== null);

                await MockWard.bulkCreate(validWards, { 
                    ignoreDuplicates: true, 
                    transaction: t  // <-- Attached to transaction
                });
                console.log(`✅ Wards staged (${validWards.length} successfully linked to Municipalities).`);
            }
            
            console.log('\n⏳ Committing transaction to the database...');
        }); 

        console.log('🎉 All geographic data successfully imported and committed!');
        process.exit(0);

    } catch (error) {
        // If anything fails inside the transaction block, Sequelize automatically rolls back.
        console.error('❌ Error during import! Transaction ROLLED BACK. No data was saved.', error);
        process.exit(1);
    }
}

//seedDatabase();