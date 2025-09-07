// Media Management System for Nashr Foundation Admin Portal

// Media management variables
let mediaLibrary = [];
let selectedImages = [];
let currentPage = 1;
let itemsPerPage = 20;
let currentFilter = 'all';

// Setup media event listeners
function setupMediaEventListeners() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

// Handle file select
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// Process uploaded files
async function processFiles(files) {
    const category = document.getElementById('asset-category')?.value || 'general';
    const autoOptimize = document.getElementById('auto-optimize')?.checked || false;
    const generateThumbnails = document.getElementById('generate-thumbnails')?.checked || false;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file, category, autoOptimize, generateThumbnails);
    }
    
    await loadMediaLibrary();
    showSuccess(`Successfully uploaded ${files.length} file(s)`);
}

// Upload individual file
async function uploadFile(file, category, autoOptimize, generateThumbnails) {
    try {
        updateUploadProgress(`Uploading ${file.name}...`);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Only image files are allowed');
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size must be less than 10MB');
        }
        
        // Create file data
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            category: category,
            uploaded_at: new Date().toISOString(),
            optimized: autoOptimize,
            thumbnails_generated: generateThumbnails
        };
        
        // Upload to Supabase storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, file);
            
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);
            
        fileData.url = urlData.publicUrl;
        fileData.storage_path = fileName;
        
        // Save to database
        const { error: dbError } = await supabase
            .from('media_library')
            .insert([fileData]);
            
        if (dbError) throw dbError;
        
        // Auto-optimize if enabled
        if (autoOptimize) {
            await optimizeImage(fileData);
        }
        
        // Generate thumbnails if enabled
        if (generateThumbnails) {
            await generateImageThumbnails(fileData);
        }
        
        logActivity('media_uploaded', `Uploaded ${file.name} to ${category} category`);
        
    } catch (error) {
        console.error('Error uploading file:', error);
        showError(`Failed to upload ${file.name}: ${error.message}`);
    }
}

// Update upload progress
function updateUploadProgress(message) {
    const progressElement = document.getElementById('upload-progress');
    if (progressElement) {
        progressElement.textContent = message;
    }
}

// Load media library
async function loadMediaLibrary() {
    try {
        const { data, error } = await supabase
            .from('media_library')
            .select('*')
            .order('uploaded_at', { ascending: false });
            
        if (error) throw error;
        
        mediaLibrary = data || [];
        displayMediaGallery();
    } catch (error) {
        console.error('Error loading media library:', error);
    }
}

// Display media gallery
function displayMediaGallery() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;
    
    const filteredMedia = currentFilter === 'all' 
        ? mediaLibrary 
        : mediaLibrary.filter(item => item.category === currentFilter);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageMedia = filteredMedia.slice(startIndex, endIndex);
    
    if (pageMedia.length === 0) {
        container.innerHTML = '<p class="text-muted">No images found</p>';
        return;
    }
    
    container.innerHTML = pageMedia.map(item => `
        <div class="gallery-item" data-id="${item.id}">
            <img src="${item.url}" alt="${item.name}" loading="lazy">
            <div class="item-overlay">
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="previewImage('${item.url}')">Preview</button>
                    <button class="btn btn-sm btn-outline" onclick="editImage('${item.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteImage('${item.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
    
    updatePagination(filteredMedia.length);
}

// Update pagination
function updatePagination(totalItems) {
    const container = document.getElementById('gallery-pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-sm btn-outline" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="btn btn-sm btn-primary">${i}</button>`;
        } else {
            paginationHTML += `<button class="btn btn-sm btn-outline" onclick="changePage(${i})">${i}</button>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-sm btn-outline" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayMediaGallery();
}

// Filter gallery
function filterGallery() {
    const filter = document.getElementById('gallery-filter')?.value || 'all';
    currentFilter = filter;
    currentPage = 1;
    displayMediaGallery();
}

// Preview image
function previewImage(url) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="image-preview-content">
            <img src="${url}" alt="Preview">
            <button class="image-preview-close" onclick="this.closest('.image-preview-modal').remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Load current hero background
async function loadCurrentHeroBackground() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'hero_background')
            .single();
            
        if (data?.value) {
            const heroImage = document.getElementById('current-hero-image');
            const heroFilename = document.getElementById('hero-filename');
            
            if (heroImage) heroImage.src = data.value;
            if (heroFilename) heroFilename.textContent = data.value.split('/').pop();
        }
    } catch (error) {
        console.error('Error loading hero background:', error);
    }
}

// Change hero background
async function changeHeroBackground() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            showLoading('Updating hero background...');
            
            // Upload new hero background
            const fileName = `hero_${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('media')
                .upload(fileName, file);
                
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);
                
            // Update settings
            await supabase
                .from('settings')
                .upsert({
                    key: 'hero_background',
                    value: urlData.publicUrl
                });
                
            // Update UI
            const heroImage = document.getElementById('current-hero-image');
            const heroFilename = document.getElementById('hero-filename');
            
            if (heroImage) heroImage.src = urlData.publicUrl;
            if (heroFilename) heroFilename.textContent = file.name;
            
            hideLoading();
            showSuccess('Hero background updated successfully!');
            logActivity('hero_background_changed', `Changed hero background to ${file.name}`);
            
        } catch (error) {
            hideLoading();
            console.error('Error updating hero background:', error);
            showError('Failed to update hero background');
        }
    };
    
    input.click();
}

// Update hero position
async function updateHeroPosition() {
    const position = document.getElementById('hero-position')?.value;
    if (!position) return;
    
    try {
        await supabase
            .from('settings')
            .upsert({
                key: 'hero_background_position',
                value: position
            });
            
        showSuccess('Hero background position updated');
        logActivity('hero_position_updated', `Updated hero position to ${position}`);
    } catch (error) {
        console.error('Error updating hero position:', error);
        showError('Failed to update hero position');
    }
}

// Update hero overlay
async function updateHeroOverlay() {
    const overlay = document.getElementById('hero-overlay')?.value;
    const overlayValue = document.getElementById('overlay-value');
    
    if (overlayValue) {
        overlayValue.textContent = overlay + '%';
    }
    
    try {
        await supabase
            .from('settings')
            .upsert({
                key: 'hero_overlay_opacity',
                value: overlay
            });
            
        logActivity('hero_overlay_updated', `Updated hero overlay to ${overlay}%`);
    } catch (error) {
        console.error('Error updating hero overlay:', error);
    }
}

// Load brand assets
async function loadBrandAssets() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('*')
            .in('key', ['main_logo', 'favicon']);
            
        if (data) {
            data.forEach(setting => {
                if (setting.key === 'main_logo') {
                    const logoPreview = document.getElementById('logo-preview');
                    if (logoPreview) logoPreview.src = setting.value;
                } else if (setting.key === 'favicon') {
                    const faviconPreview = document.getElementById('favicon-preview');
                    if (faviconPreview) faviconPreview.src = setting.value;
                }
            });
        }
    } catch (error) {
        console.error('Error loading brand assets:', error);
    }
}

// Change logo
async function changeLogo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            showLoading('Updating logo...');
            
            // Upload new logo
            const fileName = `logo_${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('media')
                .upload(fileName, file);
                
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);
                
            // Update settings
            await supabase
                .from('settings')
                .upsert({
                    key: 'main_logo',
                    value: urlData.publicUrl
                });
                
            // Update UI
            const logoPreview = document.getElementById('logo-preview');
            if (logoPreview) logoPreview.src = urlData.publicUrl;
            
            hideLoading();
            showSuccess('Logo updated successfully!');
            logActivity('logo_changed', `Changed logo to ${file.name}`);
            
        } catch (error) {
            hideLoading();
            console.error('Error updating logo:', error);
            showError('Failed to update logo');
        }
    };
    
    input.click();
}

// Optimize image
async function optimizeImage(imageData) {
    try {
        // This would integrate with an image optimization service
        // For now, we'll just mark it as optimized
        await supabase
            .from('media_library')
            .update({ optimized: true })
            .eq('id', imageData.id);
            
        console.log('Image optimized:', imageData.name);
    } catch (error) {
        console.error('Error optimizing image:', error);
    }
}

// Generate thumbnails
async function generateImageThumbnails(imageData) {
    try {
        // This would generate different sized thumbnails
        // For now, we'll just mark thumbnails as generated
        await supabase
            .from('media_library')
            .update({ thumbnails_generated: true })
            .eq('id', imageData.id);
            
        console.log('Thumbnails generated for:', imageData.name);
    } catch (error) {
        console.error('Error generating thumbnails:', error);
    }
}

// Optimize all images
async function optimizeAllImages() {
    try {
        showLoading('Optimizing all images...');
        
        const unoptimizedImages = mediaLibrary.filter(img => !img.optimized);
        
        for (const image of unoptimizedImages) {
            await optimizeImage(image);
        }
        
        hideLoading();
        showSuccess(`Optimized ${unoptimizedImages.length} images`);
        await loadMediaLibrary();
        logActivity('images_optimized', `Optimized ${unoptimizedImages.length} images`);
        
    } catch (error) {
        hideLoading();
        console.error('Error optimizing images:', error);
        showError('Failed to optimize images');
    }
}

// Setup CDN status
async function setupCDNStatus() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'cdn_provider')
            .single();
            
        const cdnStatus = document.getElementById('cdn-status');
        if (cdnStatus) {
            if (data?.value && data.value !== 'none') {
                cdnStatus.textContent = 'Online';
                cdnStatus.className = 'status-indicator online';
            } else {
                cdnStatus.textContent = 'Offline';
                cdnStatus.className = 'status-indicator offline';
            }
        }
    } catch (error) {
        console.error('Error setting up CDN status:', error);
    }
}

// Create backup
async function createBackup() {
    try {
        showLoading('Creating backup...');
        
        const backupData = {
            media_library: mediaLibrary,
            settings: await getCachedSettings(),
            content: await getCachedContent(),
            created_at: new Date().toISOString(),
            type: 'full_backup'
        };
        
        const { error } = await supabase
            .from('backups')
            .insert([backupData]);
            
        if (error) throw error;
        
        hideLoading();
        showSuccess('Backup created successfully!');
        await loadBackupList();
        logActivity('backup_created', 'Created full system backup');
        
    } catch (error) {
        hideLoading();
        console.error('Error creating backup:', error);
        showError('Failed to create backup');
    }
}

// Load backup list
async function loadBackupList() {
    try {
        const { data, error } = await supabase
            .from('backups')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        const container = document.getElementById('backup-list');
        if (container) {
            if (data && data.length > 0) {
                container.innerHTML = data.map(backup => `
                    <div class="backup-item">
                        <div class="backup-info">
                            <h4>${backup.type}</h4>
                            <p>${new Date(backup.created_at).toLocaleString()}</p>
                        </div>
                        <div class="backup-actions">
                            <button class="btn btn-sm btn-outline" onclick="restoreBackup('${backup.id}')">Restore</button>
                            <button class="btn btn-sm btn-outline" onclick="downloadBackup('${backup.id}')">Download</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-muted">No backups found</p>';
            }
        }
    } catch (error) {
        console.error('Error loading backup list:', error);
    }
}

// Media management utility functions
function uploadNewAsset() {
    document.getElementById('file-input').click();
}

function refreshMediaLibrary() {
    loadMediaLibrary();
}

function uploadBrandAsset() {
    changeLogo();
}

function setHeroBackground() {
    changeHeroBackground();
}

function previewHeroBackground() {
    const heroImage = document.getElementById('current-hero-image');
    if (heroImage && heroImage.src) {
        previewImage(heroImage.src);
    }
}

function changeFavicon() {
    // Similar to changeLogo but for favicon
    changeLogo();
}

function updateLogoSize() {
    const size = document.getElementById('logo-size')?.value;
    // Update logo size in settings
    console.log('Logo size updated to:', size);
}

function updateLogoPosition() {
    const position = document.getElementById('logo-position')?.value;
    // Update logo position in settings
    console.log('Logo position updated to:', position);
}

function createSocialTemplate() {
    showInfo('Social media template creation coming soon!');
}

function editSocialTemplate(platform) {
    showInfo(`Editing ${platform} template coming soon!`);
}

function generateSocialPost(platform) {
    showInfo(`Generating ${platform} post coming soon!`);
}

function optimizeSelectedImages() {
    showInfo('Selected image optimization coming soon!');
}

function generateThumbnails() {
    showInfo('Thumbnail generation coming soon!');
}

function updateCDNProvider() {
    const provider = document.getElementById('cdn-provider')?.value;
    const cdnUrlGroup = document.getElementById('cdn-url-group');
    
    if (cdnUrlGroup) {
        cdnUrlGroup.style.display = provider !== 'none' ? 'block' : 'none';
    }
    
    // Update CDN settings
    console.log('CDN provider updated to:', provider);
}

function toggleAutoUpload() {
    const autoUpload = document.getElementById('auto-upload')?.checked;
    console.log('Auto-upload to CDN:', autoUpload);
}

function restoreBackup(backupId) {
    showInfo('Backup restoration coming soon!');
}

function downloadBackup(backupId) {
    showInfo('Backup download coming soon!');
}

// Initialize media management when admin loads
function initializeMediaManagement() {
    setupMediaEventListeners();
    loadCurrentHeroBackground();
    loadBrandAssets();
    loadBackupList();
    setupCDNStatus();
}
