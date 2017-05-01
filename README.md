# Osmek.js
Javascript Osmek API Library

## Install
```
npm install osmek.js --save
```

## Usage
```
var OsmekApi = require('osmek'),
    Osmek = new OsmekApi([API_KEY], [cache_path]);

// Read
Osmek.get([bin_id], [options])
    .then(response => {
        console.log(response);
        // { status: 'ok', items: [...] }
    });

// Write
Osmek.create([bin_id], [data])
    .then(response => {
        console.log(response);
    });

// Update
Osmek.update([bin_id], [item_id], [data])
    .then(response => {
        console.log(response);
    });

// Delete
Osmek.delete([bin_id], [item_id])
    .then(response => {
        console.log(response);
    });
    
// Upload an image
Osmek.uploadPhoto(fs.createReadStream([image_path]), [file_name], { bin_id: [BIN_ID]})
    .then(response => {
        console.log(response);
    });

```
