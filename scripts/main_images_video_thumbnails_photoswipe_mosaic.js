import PhotoSwipeLightbox from './photoswipe-lightbox.esm.min.js';
import PhotoSwipe from './photoswipe.esm.min.js';
import instaTokenURL from './secrets.js';

const limit = 5 * 4;

const feedContainer = document.querySelector('#instafeed');

const lightbox = new PhotoSwipeLightbox();

const chunk = (array, size) =>
    Array.from({ length: Math.ceil(array.length / size) }, (value, index) =>
        array.slice(index * size, index * size + size)
    );

document.addEventListener('DOMContentLoaded', () => {
    fetch(instaTokenURL)
        .then(response => response.json())
        .then(tokenData => {
            fetch(
                `https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${tokenData.Token}&limit=${limit}`
            )
                .then(igResponse => igResponse.json())
                .then(igData => renderData(igData.data))
                .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
});

function renderData(data) {
    const splitData = chunk(data, 5);

    for (let i = 0; i < splitData.length; i++) {
        const mosaicDiv = document.createElement('div');
        const mosaicId = `mosaic-${i}`;
        mosaicDiv.id = mosaicId;

        splitData[i].forEach((post, index) => {
            mosaicDiv.appendChild(createPost(post, mosaicId));
        });

        mosaicDiv.classList.add('mosaic');
        feedContainer.appendChild(mosaicDiv);
    }
}

function createPost(post, mosaicId) {
    const postAnchor = document.createElement('a');
    postAnchor.classList.add('post');
    postAnchor.href = post.thumbnail_url || post.media_url;
    postAnchor.dataset.account = `@${post.username}`;
    postAnchor.dataset.link = post.permalink;

    // Photoswipe properties: Open only the current media
    postAnchor.dataset.pswpWidth = 1080;
    postAnchor.dataset.pswpHeight = 1080;
    postAnchor.onclick = event => {
        event.preventDefault();
        const options = {
            // Skip children
            gallery: `#${mosaicId} a`,
            closeTitle: 'Cerrar',
            bgOpacity: 0.85,
            pswpModule: PhotoSwipe,
        };
        lightbox.options = options;
        lightbox.init();
    };

    const img = document.createElement('img');
    img.src = post.thumbnail_url || post.media_url;
    img.alt = post.caption;
    postAnchor.appendChild(img);

    return postAnchor;
}

lightbox.on('uiRegister', function () {
    lightbox.pswp.ui.registerElement({
        name: 'custom-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        html: 'Caption text',
        onInit: (el, pswp) => {
            lightbox.pswp.on('change', () => {
                // Add caption
                const currSlideElement = lightbox.pswp.currSlide.data.element;
                if (currSlideElement) {
                    el.innerHTML = `
                        <a href="${
                            currSlideElement.querySelector('img').parentElement
                                .dataset.link
                        }"
                            target="_blank" rel="noopener noreferrer">
                            ${
                                currSlideElement.querySelector('img').alt !==
                                'undefined'
                                    ? currSlideElement.querySelector('img').alt
                                    : 'Ver en Instagram'
                            }
                        </a>
                    `;
                }
            });
        },
    });

    lightbox.pswp.ui.registerElement({
        name: 'social-button',
        order: 9,
        isButton: true,
        onInit: (el, pswp) => {
            lightbox.pswp.on('change', () => {
                const currSlideElement = lightbox.pswp.currSlide.data.element;
                const permalink =
                    currSlideElement.querySelector('img').parentElement.dataset
                        .link;
                const account =
                    currSlideElement.querySelector('img').parentElement.dataset
                        .account;
                el.innerHTML = `
                    <div class="open-instagram">
                        <i class="fab fa-instagram"></i>
                        <a href="${permalink}"
                            target="_blank" rel="noopener noreferrer">
                            ${account}
                        </a>
                    </div>
                `;
            });
        },
    });
});
