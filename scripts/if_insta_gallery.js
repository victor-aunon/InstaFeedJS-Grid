import instaTokenURL from './if_secrets.js';
import {config} from './if_config.js'

const feedContainer = document.querySelector('#instafeed');
const modal = document.querySelector('#if-modal');
const closeButton = document.querySelector('#if-close-button');
const showMoreLessSpan = document.querySelector('#if-show-more-less');

const chunk = (array, size) =>
    Array.from({ length: Math.ceil(array.length / size) }, (value, index) =>
        array.slice(index * size, index * size + size)
    );

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    fetch(instaTokenURL)
        .then(response => response.json())
        .then(tokenData => {
            console.log('Token fetched');
            fetch(
                `https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username,children&access_token=${tokenData.Token}&limit=${config.LIMIT}`
            )
                .then(igResponse => igResponse.json())
                .then(igData => {
                    if (!igData.error) {
                        console.log('Feed fetched');
                        renderData(igData.data);
                    } else {
                        console.error(igData.error.message);
                    }
                })
                .catch(error => console.error(error));
        })
        .catch(error => console.error(error));
});

modal.addEventListener('click', event => {
    const noCloseElements = [
        document.querySelector('.if-modal-content'),
        document.querySelector('.if-modal-caption'),
        document.querySelector('#if-caption'),
        showMoreLessSpan,
        document.querySelector('#if-permalink'),
        document.querySelector('#if-prev-button'),
        document.querySelector('#if-next-button'),
    ];
    if (!noCloseElements.includes(event.target)) {
        modal.classList.remove('if-modal-visible');
    }
});

closeButton.addEventListener('click', () =>
    modal.classList.remove('if-modal-visible')
);

// FUNCTIONS

function renderData(data) {
    const splitData = chunk(data, config.LAYOUT.items);

    for (let i = 0; i < splitData.length; i++) {
        const mosaicDiv = document.createElement('div');
        const mosaicId = `if-mosaic-${i}`;
        mosaicDiv.id = mosaicId;

        splitData[i].forEach((post, index) => {
            mosaicDiv.appendChild(createPost(post));
        });

        mosaicDiv.classList.add(config.LAYOUT.className);
        feedContainer.appendChild(mosaicDiv);
    }
}

function createPost(post) {
    const postAnchor = document.createElement('a');
    postAnchor.classList.add('if-post');
    postAnchor.href = post.thumbnail_url || post.media_url;

    // Create child element (image or video)
    switch (post.media_type) {
        case 'IMAGE':
            const img = document.createElement('img');
            img.src = post.media_url;
            img.alt = post.caption;
            postAnchor.appendChild(img);
            break;

        case 'CAROUSEL_ALBUM':
            const imgAlbum = document.createElement('img');
            imgAlbum.src = post.media_url;
            imgAlbum.alt = post.caption;
            const slidesIcon = document.createElement('i');
            slidesIcon.className = 'far fa-images';
            postAnchor.appendChild(imgAlbum);
            postAnchor.appendChild(slidesIcon);
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

    postAnchor.onclick = event => {
        event.preventDefault();
        displayModal(postAnchor, post, event);
    };

    return postAnchor;
}

function displayModal(clickedElement, post, event) {
    // Modal selectors
    const contentContainer = document.querySelector(
        '.if-modal-content-container'
    );
    const sourceLink = document.querySelector('#if-permalink');
    const caption = document.querySelector('#if-caption');

    // Clear the modal content container
    while (contentContainer.firstChild) {
        contentContainer.removeChild(contentContainer.firstChild);
    }

    switch (post.media_type) {
        case 'IMAGE':
            const modalImg = document.createElement('img');
            modalImg.classList.add('if-modal-content');
            modalImg.src = post.media_url;
            modalImg.alt = post.caption;
            contentContainer.appendChild(modalImg);
            break;
        case 'CAROUSEL_ALBUM':
            const slideNum = document.createElement('div');
            slideNum.id = 'if-slide-counter';
            slideNum.textContent = `1 / ${post.children.data.length}`;
            contentContainer.appendChild(slideNum);

            const prevSlide = document.createElement('a');
            prevSlide.classList.add('if-slide-button');
            prevSlide.id = 'if-prev-button';
            prevSlide.innerHTML = `<i class="fas fa-chevron-left"></i>`;
            prevSlide.onclick = () => {
                const slides = document.querySelectorAll('.if-slide');
                let visibleIndex;
                slides.forEach((slide, index) => {
                    if (slide.classList.contains('if-modal-content')) {
                        slide.classList.remove('if-modal-content');
                        slide.style.display = 'none';
                        visibleIndex = index;
                    }
                });
                if (visibleIndex === 0) {
                    slides[slides.length - 1].classList.add('if-modal-content');
                    slides[slides.length - 1].style.display = 'block';
                    slideNum.textContent = `${post.children.data.length} / ${post.children.data.length}`;
                } else {
                    slides[visibleIndex - 1].classList.add('if-modal-content');
                    slides[visibleIndex - 1].style.display = 'block';
                    slideNum.textContent = `${visibleIndex} / ${post.children.data.length}`;
                }
            };
            contentContainer.appendChild(prevSlide);

            const nextSlide = document.createElement('a');
            nextSlide.classList.add('if-slide-button');
            nextSlide.id = 'if-next-button';
            nextSlide.innerHTML = `<i class="fas fa-chevron-right"></i>`;
            nextSlide.onclick = () => {
                const slides = document.querySelectorAll('.if-slide');
                let visibleIndex;
                slides.forEach((slide, index) => {
                    if (slide.classList.contains('if-modal-content')) {
                        slide.classList.remove('if-modal-content');
                        slide.style.display = 'none';
                        visibleIndex = index;
                    }
                });
                if (visibleIndex === slides.length - 1) {
                    slides[0].classList.add('if-modal-content');
                    slides[0].style.display = 'block';
                    slideNum.textContent = `1 / ${post.children.data.length}`;
                } else {
                    slides[visibleIndex + 1].classList.add('if-modal-content');
                    slides[visibleIndex + 1].style.display = 'block';
                    slideNum.textContent = `${visibleIndex + 2} / ${
                        post.children.data.length
                    }`;
                }
            };
            contentContainer.appendChild(nextSlide);

            post.children.data.forEach((child, index) => {
                // Fetch post children
                let slide;
                fetchChildrenFromCarousel(child.id).then(childData => {
                    if (childData.media_type === 'IMAGE') {
                        slide = document.createElement('img');
                        slide.alt = post.caption;
                    } else {
                        slide = document.createElement('vid');
                        slide.controls = true;
                    }
                    slide.classList.add('if-slide');
                    index === 0
                        ? slide.classList.add('if-modal-content')
                        : (slide.style.display = 'none');
                    slide.src = childData.media_url;
                    contentContainer.appendChild(slide);
                });
            });
            break;
        case 'VIDEO':
            const modalVid = document.createElement('video');
            modalVid.classList.add('if-modal-content');
            modalVid.controls = true;
            modalVid.src = post.media_url;
            modalVid.poster = post.thumbnail_url;
            contentContainer.appendChild(modalVid);
            break;
        default:
            break;
    }

    sourceLink.href = post.permalink;
    sourceLink.innerHTML = `<i class="fab fa-instagram"></i>@${post.username}`;

    // caption.href = post.permalink;
    // Show only 450 characters of the image/video caption
    if (post.caption) {
        if (post.caption.length > 450) {
            caption.innerHTML = post.caption.slice(0, 450);
            showMoreLessSpan.textContent = ` ...${config.SHOW_MORE}`;
            showMoreLessSpan.style.display = 'inline';
            caption.appendChild(showMoreLessSpan);

            // Add event listener to the show more/less text
            showMoreLessSpan.addEventListener('click', () => {
                console.log('span clicked');
                if (showMoreLessSpan.classList.contains('if-show-more')) {
                    caption.innerHTML = post.caption;
                    showMoreLessSpan.classList.remove('if-show-more');
                    showMoreLessSpan.classList.add('if-show-less');
                    showMoreLessSpan.textContent = ` ${config.SHOW_LESS}`;
                    caption.appendChild(showMoreLessSpan);
                } else {
                    caption.innerHTML = post.caption.slice(0, 450);
                    showMoreLessSpan.classList.remove('if-show-less');
                    showMoreLessSpan.classList.add('if-show-more');
                    showMoreLessSpan.textContent = ` ...${config.SHOW_MORE}`;
                    caption.appendChild(showMoreLessSpan);
                }
            });
        } else {
            caption.textContent = post.caption;
        }
    }

    modal.animate(
        [
            {
                opacity: '0',
                top: `${event.clientY - window.innerHeight / 2}px`,
                left: `${event.clientX - window.innerWidth / 2}px`,
                transform: 'scale(0)',
            },
            {
                opacity: '1',
                top: '0',
                left: '0',
                transform: 'scale(1)',
            },
        ],
        { duration: config.ANIM_DURATION }
    );
    modal.classList.add('if-modal-visible');
}

async function fetchChildrenFromCarousel(id) {
    const token = await fetch(instaTokenURL)
        .then(response => response.json())
        .then(tokenData => tokenData.Token)
        .catch(error => console.error(error));

    const childData = await fetch(
        `https://graph.instagram.com/${id}?fields=media_type,media_url&access_token=${token}`
    )
        .then(igResponse => igResponse.json())
        .then(igData => {
            if (!igData.error) {
                console.log('Child fetched');
                return igData;
            } else {
                console.error(igData.error.message);
            }
        })
        .catch(error => console.error(error));

    return childData;
}
