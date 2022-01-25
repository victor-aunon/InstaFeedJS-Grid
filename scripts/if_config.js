import layouts from './if_layouts.js';

const config = {
    // Number of posts to display
    LIMIT: 6 * 3,
    // Layout can be mosaic, threeInRow or sixInRow
    LAYOUT: layouts.threeInRow,
    // Duration of the opening animation in ms
    ANIM_DURATION: 200,
    // Show more text
    SHOW_MORE: 'Mostrar más',
    // Show less text
    SHOW_LESS: 'Mostrar menos'
}

export { config };
