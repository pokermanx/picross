const pImage = require('pureimage');
const fs = require('fs');

function getImageFromMap(width, height, map, levelName) {
    const image = pImage.make(width, height);

    for (let iRow = 0; iRow < map.length; iRow++) {
        for (let iTile = 0; iTile < map[iRow].length; iTile++) {
            const tileColour = map[iRow][iTile] === 1 ? 0x000000ff : 0xFFFFFFff;
            image.setPixelRGBA(iTile, iRow, tileColour);
        }
    }

    const path = `./server/previews/${levelName}.png`;

    return pImage.encodePNGToStream(image, fs.createWriteStream(path))
        .then(() => {
            return path;
        });
};

module.exports = { getImageFromMap };
