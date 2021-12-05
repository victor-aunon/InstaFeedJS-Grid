import PhotoSwipeLightbox from './photoswipe-lightbox.esm.min.js';
import PhotoSwipe from './photoswipe.esm.min.js';
import instaTokenURL from './secrets.js'

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

document.addEventListener('click', event => {
    if (event.target.contains(document.querySelector('.pswp__content'))) {
        try {
            lightbox.pswp.close();
        } catch (error) {
            console.log(error);
        }
    }
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

    // Photoswipe properties: Open only the current media
    postAnchor.onclick = event => {
        event.preventDefault();
        const options = {
            // Skip children
            closeTitle: 'Cerrar',
            bgOpacity: 0.85,
            pswpModule: PhotoSwipe,
        };
        switch (post.media_type) {
            case 'IMAGE':
                options.dataSource = [
                    {
                        html: `
                            <img class="custom-slide" src="${post.media_url}"
                                alt="${post.caption}"
                                data-account="@${post.username}"
                                data-link="${post.permalink}"
                            >
                        `,
                    },
                ];
                break;
            case 'CAROUSEL_ALBUM':
                options.dataSource = [
                    {
                        html: `
                            <img class="custom-slide" src="${post.media_url}"
                                alt="${post.caption}"
                                data-account="@${post.username}"
                                data-link="${post.permalink}"
                            >
                        `,
                    },
                ];
                break;
            case 'VIDEO':
                options.dataSource = [
                    {
                        html: `
                            <video class="custom-slide" controls
                                data-account="@${post.username}"
                                data-link="${post.permalink}"
                                data-caption="${post.caption}"
                            >
                                <source src="${post.media_url}">
                            </video>
                        `,
                    },
                ];
                break;
            default:
                break;
        }
        lightbox.options = options;
        lightbox.init();
        lightbox.loadAndOpen(0);
    };

    switch (post.media_type) {
        case 'IMAGE':
            const img = document.createElement('img');
            img.src = post.thumbnail_url || post.media_url;
            img.alt = post.caption;
            postAnchor.appendChild(img);
            break;

        case 'CAROUSEL_ALBUM':
            const imgAlbum = document.createElement('img');
            imgAlbum.src = post.thumbnail_url || post.media_url;
            imgAlbum.alt = post.caption;
            postAnchor.appendChild(imgAlbum);
            break;

        case 'VIDEO':
            const vid = document.createElement('video');
            vid.autoplay = true;
            vid.muted = true;
            vid.loop = true;
            vid.poster = post.thumbnail_url;
            vid.dataset.caption = post.caption;
            const source = document.createElement('source');
            source.src = post.media_url;
            vid.appendChild(source);
            postAnchor.appendChild(vid);
            break;

        default:
            break;
    }

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
                const parser = new DOMParser();
                const refElement = parser
                    .parseFromString(pswp.ei.html, 'text/html')
                    .querySelector('.custom-slide');
                if (refElement) {
                    el.innerHTML = `
                        <a href="${refElement.dataset.link}"
                            target="_blank" rel="noopener noreferrer">
                            ${
                                refElement.nodeName === 'IMG'
                                    ? refElement.alt !== 'undefined'
                                        ? refElement.alt
                                        : 'Ver en Instagram'
                                    : refElement.dataset.caption !== 'undefined'
                                        ? refElement.dataset.caption
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
                // Add Button to open the post in Instagram
                const parser = new DOMParser();
                const refElement = parser
                    .parseFromString(pswp.ei.html, 'text/html')
                    .querySelector('.custom-slide');
                if (refElement) {
                    el.innerHTML = `
                        <div class="open-instagram">
                            <i class="fab fa-instagram"></i>
                            <a href="${refElement.dataset.link}"
                                target="_blank" rel="noopener noreferrer">
                                ${refElement.dataset.account}
                            </a>
                        </div>
                    `;
                }
            });
        },
    });
});
