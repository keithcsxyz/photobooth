document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const stripCanvas = document.getElementById('stripCanvas');
    const startButton = document.getElementById('startButton');
    const clearButton = document.getElementById('clearButton');
    const photoCountSelect = document.getElementById('photoCount');
    const photoStripContainer = document.getElementById('photoStripContainer');
    const colorOptions = document.querySelectorAll('.color-option');
    const stripCtx = stripCanvas.getContext('2d');
    const ctx = canvas.getContext('2d'); // Initialize canvas context
    
    let photosTaken = 0;
    let photosToTake = 1;
    let capturedPhotos = [];
    let selectedFrameColor = '#f5f7fa'; // Default frame background color

    // Handle color selection for the photo booth frame
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedFrameColor = option.dataset.color; // Update only the output frame background color
        });
    });

    // Initialize camera
    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: false 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Unable to access camera. Please ensure camera permissions are granted.");
        }
    }

    // Take picture with countdown
    function takePicture() {
        return new Promise((resolve) => {
            let count = 3;
            const timer = document.getElementById('timer');
            timer.textContent = count;
            timer.style.display = 'flex';

            const countdown = setInterval(() => {
                count--;
                if (count > 0) {
                    timer.textContent = count;
                } else {
                    clearInterval(countdown);
                    timer.style.display = 'none';

                    // Capture image (not mirrored)
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation matrix
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const photoUrl = canvas.toDataURL('image/png');

                    // Store captured photo URL
                    capturedPhotos.push(photoUrl);

                    resolve();
                }
            }, 1000);
        });
    }

    // Create photo strip from captured photos
    function createPhotoStrip() {
        // Clear previous photo strips
        photoStripContainer.innerHTML = '';
        photoStripContainer.style.display = 'flex';

        // Set strip dimensions based on number of photos
        const stripWidth = 300;
        const photoHeight = 200;
        const gap = 10;
        const stripHeight = photoHeight * capturedPhotos.length + gap * (capturedPhotos.length - 1) + 100;

        // Set canvas size
        stripCanvas.width = stripWidth;
        stripCanvas.height = stripHeight;

        // Draw the selected background color
        stripCtx.fillStyle = selectedFrameColor;
        stripCtx.fillRect(0, 0, stripWidth, stripHeight);

        // Draw header
        stripCtx.fillStyle = 'linear-gradient(90deg, #a5b4fc, #f0abfc)';
        stripCtx.fillRect(stripWidth * 0.2, 0, stripWidth * 0.6, 8);

        // Draw title
        stripCtx.fillStyle = '#374151';
        stripCtx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        stripCtx.textAlign = 'center';
        stripCtx.fillText('Photobooth', stripWidth / 2, 30);

        // Load and draw each photo
        const loadPhotoPromises = capturedPhotos.map((photoUrl, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const y = 50 + index * (photoHeight + gap);
                    stripCtx.drawImage(img, 0, y, stripWidth, photoHeight);
                    resolve();
                };
                img.src = photoUrl;
            });
        });

        // After all photos are drawn
        Promise.all(loadPhotoPromises).then(() => {
            // Add watermark at the bottom
            stripCtx.font = '14px "Segoe UI", Arial, sans-serif';
            stripCtx.fillStyle = '#9CA3AF';
            stripCtx.textAlign = 'center';
            stripCtx.fillText("By: Keith", stripWidth / 2, stripHeight - 15);

            // Draw date
            const date = new Date().toLocaleDateString();
            stripCtx.fillStyle = '#6b7280';
            stripCtx.font = '12px "Segoe UI", Arial, sans-serif';
            stripCtx.fillText(date, stripWidth / 2, stripHeight - 35);

            // Create final strip image
            const stripUrl = stripCanvas.toDataURL('image/png');

            // Create photo strip element
            const photoStrip = document.createElement('div');
            photoStrip.className = 'photo-strip';
            photoStrip.innerHTML = `
                <div class="photo-strip-title">Photobooth Strip</div>
                <img src="${stripUrl}" alt="Photo Strip">
                <button id="saveStripBtn" class="btn btn-custom w-100 mt-2">Save Photo Strip</button>
            `;
            photoStripContainer.appendChild(photoStrip);

            // Add save functionality
            const saveStripBtn = document.getElementById('saveStripBtn');
            saveStripBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `photostrip_${Date.now()}.png`;
                link.href = stripUrl;
                link.click();
            });
        });
    }

    // Start photo session
    async function startPhotoSession() {
        photosTaken = 0;
        photosToTake = parseInt(photoCountSelect.value);
        capturedPhotos = [];
        startButton.disabled = true;
        photoStripContainer.style.display = 'none';

        while (photosTaken < photosToTake) {
            await takePicture();
            photosTaken++;

            // Add small delay between photos
            if (photosTaken < photosToTake) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Create photo strip once all photos are taken
        createPhotoStrip();
        startButton.disabled = false;
    }

    // Clear all photos
    function clearPhotos() {
        capturedPhotos = [];
        photoStripContainer.innerHTML = '';
        photoStripContainer.style.display = 'none';
    }

    // Event listeners
    startButton.addEventListener('click', startPhotoSession);
    clearButton.addEventListener('click', clearPhotos);

    // Initialize camera on page load
    initCamera();
});